import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return NextResponse.redirect("https://preview.mallardcreative.net/preview/" + slug);
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeKey);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency:     "usd",
        unit_amount:  10000, // $100
        product_data: {
          name:        "Website — Claim Your Preview",
          description: "One-time payment to claim and fully customize your preview website. You only pay if you love it.",
        },
      },
      quantity: 1,
    }],
    mode:        "payment",
    metadata:    { site_slug: slug },
    success_url: `https://preview.mallardcreative.net/preview/${slug}?claimed=true`,
    cancel_url:  `https://preview.mallardcreative.net/preview/${slug}`,
  });

  return NextResponse.redirect(session.url!);
}
