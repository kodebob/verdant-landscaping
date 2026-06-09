import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const { slug, status } = await req.json();
  if (!slug || !["preview", "sold"].includes(status)) {
    return NextResponse.json({ error: "Invalid slug or status" }, { status: 400 });
  }

  const { error } = await supabase.from("sites").update({ status }).eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
