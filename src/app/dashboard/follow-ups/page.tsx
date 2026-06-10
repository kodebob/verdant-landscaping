"use client";

import { useState, useEffect } from "react";
import { Clock, Send, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FollowUp {
  id: string;
  business_id: string;
  site_slug: string;
  scheduled_for: string;
  sent_at: string | null;
  status: "pending" | "sent" | "skipped" | "failed";
  businesses: { name: string; phone: string } | null;
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => { fetchFollowUps(); }, []);

  async function fetchFollowUps() {
    const { data } = await supabase
      .from("follow_ups")
      .select("*, businesses(name, phone)")
      .order("scheduled_for", { ascending: true })
      .limit(100);
    setFollowUps((data as FollowUp[]) ?? []);
  }

  async function sendNow(fu: FollowUp) {
    if (!fu.businesses?.phone || sending) return;
    setSending(fu.id);
    try {
      await fetch("/api/send-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:           fu.businesses.phone,
          businessId:   fu.business_id,
          businessName: fu.businesses.name,
          previewUrl:   `https://preview.mallardcreative.net/preview/${fu.site_slug}`,
          isFollowUp:   true,
          skipTimeCheck: true,
        }),
      });
      await supabase.from("follow_ups").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", fu.id);
      fetchFollowUps();
    } finally {
      setSending(null);
    }
  }

  async function skip(id: string) {
    await supabase.from("follow_ups").update({ status: "skipped" }).eq("id", id);
    fetchFollowUps();
  }

  const pending = followUps.filter((f) => f.status === "pending");
  const sent    = followUps.filter((f) => f.status === "sent");
  const isDue   = (f: FollowUp) => new Date(f.scheduled_for) <= new Date();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-white font-sans font-bold text-xl">Follow Ups</h1>
        <p className="text-white/35 text-sm font-sans mt-1">48-hour follow-up texts to non-responders</p>
      </div>

      {/* Pending */}
      <div className="bg-[#0d1321] border border-white/6 mb-6">
        <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
          <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans">Pending</p>
          <span className="text-white/30 text-xs font-sans">{pending.length} queued</span>
        </div>
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-white/5">
              {["Business", "Phone", "Preview", "Scheduled", "Actions"].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-white/25 text-[10px] tracking-[0.2em] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-white/20 text-sm">No follow-ups pending</td></tr>
            )}
            {pending.map((fu) => (
              <tr key={fu.id} className={`border-b border-white/4 transition-colors ${isDue(fu) ? "bg-amber-950/10" : "hover:bg-white/2"}`}>
                <td className="px-6 py-3 text-white font-medium">{fu.businesses?.name ?? "—"}</td>
                <td className="px-6 py-3 text-white/50">{fu.businesses?.phone ?? "—"}</td>
                <td className="px-6 py-3">
                  <a
                    href={`/preview/${fu.site_slug}`}
                    target="_blank"
                    className="text-[#d4a853] text-xs hover:underline truncate max-w-[160px] block"
                  >
                    {fu.site_slug}
                  </a>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {isDue(fu) && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
                    <span className={`text-xs font-sans ${isDue(fu) ? "text-amber-400" : "text-white/35"}`}>
                      {new Date(fu.scheduled_for).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => sendNow(fu)}
                      disabled={!!sending}
                      className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase font-semibold px-2.5 py-1.5 bg-[#d4a853]/10 text-[#d4a853] hover:bg-[#d4a853]/20 transition-colors disabled:opacity-50"
                    >
                      {sending === fu.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Send
                    </button>
                    <button
                      onClick={() => skip(fu.id)}
                      className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase font-semibold px-2.5 py-1.5 bg-white/5 text-white/40 hover:bg-white/10 transition-colors"
                    >
                      <X className="w-3 h-3" />Skip
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sent history */}
      <div className="bg-[#0d1321] border border-white/6">
        <div className="px-6 py-4 border-b border-white/6">
          <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans">Sent</p>
        </div>
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-white/5">
              {["Business", "Preview", "Sent At"].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-white/25 text-[10px] tracking-[0.2em] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sent.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-white/20 text-sm">No follow-ups sent yet</td></tr>
            )}
            {sent.map((fu) => (
              <tr key={fu.id} className="border-b border-white/4 hover:bg-white/2">
                <td className="px-6 py-3 text-white">{fu.businesses?.name ?? "—"}</td>
                <td className="px-6 py-3 text-white/40 text-xs">{fu.site_slug}</td>
                <td className="px-6 py-3 text-white/35">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                    {fu.sent_at && new Date(fu.sent_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
