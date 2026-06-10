import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const stripeKey    = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return new NextResponse("Stripe not configured", { status: 200 });
  }

  const Stripe  = (await import("stripe")).default;
  const stripe  = new Stripe(stripeKey);
  const body    = await req.text();
  const sig     = req.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session  = event.data.object as { metadata?: { site_slug?: string }; amount_total?: number; payment_intent?: string };
    const slug     = session.metadata?.site_slug;
    if (!slug) return new NextResponse("OK", { status: 200 });

    // Mark site as sold
    await supabase.from("sites").update({ status: "sold" }).eq("slug", slug);

    // Get business info for notifications
    const { data: site } = await supabase
      .from("sites")
      .select("business_name, place_id")
      .eq("slug", slug)
      .single();

    if (site) {
      // Log to sales table
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, phone")
        .eq("place_id", site.place_id ?? "")
        .maybeSingle();

      await supabase.from("sales").insert({
        business_id:       biz?.id ?? null,
        amount:            (session.amount_total ?? 10000) / 100,
        stripe_payment_id: String(session.payment_intent ?? ""),
      });

      // Notify Kody
      const kodyPhone  = process.env.KODY_PHONE_NUMBER;
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken  = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = (process.env.TWILIO_PHONE_NUMBERS ?? process.env.TWILIO_PHONE_NUMBER ?? "").split(",")[0]?.trim();

      if (kodyPhone && accountSid && authToken && fromNumber) {
        const twilio = (await import("twilio")).default;
        await twilio(accountSid, authToken).messages.create({
          body: `💰 SALE! ${site.business_name} just paid $100 for their website. Slug: ${slug}`,
          from: fromNumber,
          to:   kodyPhone,
        }).catch(() => {});

        // Send customer confirmation if we have their phone
        if (biz?.phone) {
          await twilio(accountSid, authToken).messages.create({
            body: `Payment received! I'll have your site fully customized within 48 hours. Text me your photos and any changes you want — Kody`,
            from: fromNumber,
            to:   biz.phone,
          }).catch(() => {});
        }
      }
    }
  }

  return new NextResponse("OK", { status: 200 });
}
