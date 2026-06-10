import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { to, message, businessId } = await req.json();

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 });
  }

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);

    const msg = await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    });

    // Log to outreach_log
    await supabase.from("outreach_log").insert({
      business_id: businessId ?? null,
      method: "text",
      message,
      sent_at: new Date().toISOString(),
      delivery_status: msg.status,
      twilio_sid: msg.sid,
    });

    return NextResponse.json({ success: true, sid: msg.sid, status: msg.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 500 }
    );
  }
}
