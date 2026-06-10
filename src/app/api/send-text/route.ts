import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ── Kody's 5 outreach templates ──────────────────────────────────────────────
export const TEMPLATES = [
  (biz: string, url: string) =>
    `Hey ${biz}, I know you get texts like this all the time but hear me out — I'm Kody, I'm 18 and just started my web dev business out of Pittsburgh. I already built ${biz} a free website, take a look: ${url} — only $100 to claim it and I'll fix it however you want. You only pay if you love it`,

  (biz: string, url: string) =>
    `Hey ${biz} this is Kody — 18 year old web developer from Pittsburgh. Instead of just pitching you I built ${biz} a website already: ${url}. $100 to own it, I'll add your photos and change anything you want. Don't love it, pay nothing`,

  (biz: string, url: string) =>
    `Hey ${biz} — my name's Kody, I'm 18 and building my portfolio out of Pittsburgh. I built your company a free website before reaching out: ${url}. Only charging $100 right now, I'll customize it however you want. Only pay if you love it`,

  (biz: string, url: string) =>
    `Hey ${biz}, this is Kody — I'm 18 and just launched my web business in Pittsburgh. I already built ${biz} a site, wanted you to see it first: ${url}. $100 to claim it, add your pictures, change anything. Zero risk — only pay if you love it`,

  (biz: string, url: string) =>
    `Hey ${biz} — Kody here, 18 year old web developer out of Pittsburgh. Built ${biz} a free website already: ${url}. Trying to build my portfolio so only $100 right now. I'll fix whatever you want and you only pay if you love it`,
];

export const FOLLOW_UP_TEMPLATE = (biz: string, url: string) =>
  `Hey ${biz} — Kody again, just bumping this up. Your preview site expires soon: ${url}. $100 to claim it — Kody`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNumberPool(): string[] {
  const raw = process.env.TWILIO_PHONE_NUMBERS ?? process.env.TWILIO_PHONE_NUMBER ?? "";
  return raw.split(",").map((n) => n.trim()).filter(Boolean);
}

function isWithinSendWindow(): boolean {
  // Only send 9am–6pm Eastern
  const et = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const hour = new Date(et).getHours();
  return hour >= 9 && hour < 18;
}

async function pickNumber(pool: string[]): Promise<string | null> {
  if (!pool.length) return null;
  const today = new Date().toISOString().slice(0, 10);

  // Count texts sent today per number
  const { data } = await supabase
    .from("outreach_log")
    .select("twilio_number_used")
    .gte("sent_at", `${today}T00:00:00Z`);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.twilio_number_used) {
      counts[row.twilio_number_used] = (counts[row.twilio_number_used] ?? 0) + 1;
    }
  }

  // Pick number with fewest texts today that's under the 50/day limit
  const available = pool
    .map((n) => ({ n, count: counts[n] ?? 0 }))
    .filter(({ count }) => count < 50)
    .sort((a, b) => a.count - b.count);

  return available[0]?.n ?? null;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const {
    to,
    message,
    businessId,
    businessName,
    previewUrl,
    templateIndex,
    isFollowUp = false,
    skipTimeCheck = false,
  } = await req.json();

  if (!skipTimeCheck && !isWithinSendWindow()) {
    return NextResponse.json({ error: "Outside send window (9am–6pm ET)" }, { status: 400 });
  }

  const accountSid  = process.env.TWILIO_ACCOUNT_SID;
  const authToken   = process.env.TWILIO_AUTH_TOKEN;
  const numberPool  = getNumberPool();

  if (!accountSid || !authToken || !numberPool.length) {
    return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 });
  }

  const fromNumber = await pickNumber(numberPool);
  if (!fromNumber) {
    return NextResponse.json({ error: "All numbers at daily send limit (50/number)" }, { status: 429 });
  }

  // Build message body
  let body = message;
  if (!body && businessName && previewUrl) {
    const idx = templateIndex ?? 0;
    body = isFollowUp
      ? FOLLOW_UP_TEMPLATE(businessName, previewUrl)
      : TEMPLATES[idx % TEMPLATES.length](businessName, previewUrl);
  }
  if (!body) return NextResponse.json({ error: "No message body" }, { status: 400 });

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);

    const msg = await client.messages.create({ body, from: fromNumber, to });

    await supabase.from("outreach_log").insert({
      business_id:         businessId ?? null,
      method:              "text",
      message:             body,
      sent_at:             new Date().toISOString(),
      delivery_status:     msg.status,
      twilio_sid:          msg.sid,
      twilio_number_used:  fromNumber,
      message_variation:   templateIndex ?? 0,
    });

    if (businessId) {
      await supabase
        .from("businesses")
        .update({ status: isFollowUp ? "followed_up" : "texted" })
        .eq("id", businessId);
    }

    return NextResponse.json({ success: true, sid: msg.sid, status: msg.status, from: fromNumber });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 500 }
    );
  }
}
