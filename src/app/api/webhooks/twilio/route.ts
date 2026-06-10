import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);

  const from    = params.get("From") ?? "";
  const to      = params.get("To") ?? "";
  const message = params.get("Body") ?? "";

  if (!from || !message) {
    return new NextResponse("OK", { status: 200 });
  }

  // Find matching business by phone number
  const clean = (p: string) => p.replace(/\D/g, "").slice(-10);
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .ilike("phone", `%${clean(from).slice(-7)}%`)
    .maybeSingle();

  await supabase.from("responses").insert({
    business_id: business?.id ?? null,
    from_number: from,
    to_number: to,
    message,
    direction: "inbound",
    created_at: new Date().toISOString(),
  });

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
