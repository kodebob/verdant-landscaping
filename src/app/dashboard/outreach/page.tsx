"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, Check, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Business {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
}

interface OutreachLog {
  id: string;
  business_id: string;
  method: string;
  message: string;
  sent_at: string;
  delivery_status: string;
  businesses?: { name: string } | null;
}

const TEXT_TEMPLATES = [
  {
    id: "t1",
    label: "Template 1 — Direct",
    body: (name: string, url: string) =>
      `Hey ${name}, I built a free preview website for your business — check it out: ${url}\n\nNo obligation, just wanted to show you what's possible. -Kody @ Mallard Creative`,
  },
  {
    id: "t2",
    label: "Template 2 — Question",
    body: (name: string, url: string) =>
      `Hi ${name} — quick question: are you happy with your online presence?\n\nI put together a custom site preview for you: ${url}\n\nTotally free to look at!`,
  },
  {
    id: "t3",
    label: "Template 3 — Value",
    body: (name: string, url: string) =>
      `${name}, I noticed you could use a stronger web presence. I built you a free sample site: ${url}\n\nTakes 30 seconds to look, no strings attached.`,
  },
];

function getPreviewUrl(business: Business) {
  const slug = business.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
  return `https://preview.mallardcreative.net/preview/${slug}`;
}

export default function OutreachPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState("t1");
  const [schedule, setSchedule] = useState<"now" | "tomorrow" | "custom">("now");
  const [customDate, setCustomDate] = useState("");
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [log, setLog] = useState<OutreachLog[]>([]);

  useEffect(() => {
    fetchBusinesses();
    fetchLog();
  }, []);

  async function fetchBusinesses() {
    const { data } = await supabase
      .from("businesses")
      .select("id, name, phone, city")
      .not("phone", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);
    setBusinesses(data ?? []);
  }

  async function fetchLog() {
    const { data } = await supabase
      .from("outreach_log")
      .select("*, businesses(name)")
      .order("sent_at", { ascending: false })
      .limit(50);
    setLog((data as OutreachLog[]) ?? []);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const template = TEXT_TEMPLATES.find((t) => t.id === templateId)!;
  const previewBusiness = businesses.find((b) => selected.has(b.id));
  const previewText = previewBusiness
    ? template.body(previewBusiness.name, getPreviewUrl(previewBusiness))
    : template.body("[Business Name]", "https://preview.mallardcreative.net/preview/example");

  async function handleSend() {
    const targets = businesses.filter((b) => selected.has(b.id) && b.phone);
    if (!targets.length) return;
    setSending(true);
    setSentCount(0);

    for (const b of targets) {
      const message = template.body(b.name, getPreviewUrl(b));
      await fetch("/api/send-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: b.phone, message, businessId: b.id }),
      });
      setSentCount((c) => c + 1);
    }

    setSending(false);
    setSelected(new Set());
    fetchLog();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-white font-sans font-bold text-xl">Outreach</h1>
        <p className="text-white/35 text-sm font-sans mt-1">Send texts to prospects</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Left — Business selector */}
        <div className="bg-[#0d1321] border border-white/6">
          <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
            <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans">Select Businesses</p>
            <span className="text-white/30 text-xs font-sans">{selected.size} selected</span>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-white/4">
            {businesses.length === 0 ? (
              <p className="px-5 py-6 text-white/25 text-sm font-sans text-center">
                No businesses yet — find some first
              </p>
            ) : (
              businesses.map((b) => (
                <label key={b.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.has(b.id)}
                    onChange={() => toggleSelect(b.id)}
                    className="accent-[#d4a853]"
                  />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-sans font-medium truncate">{b.name}</p>
                    <p className="text-white/35 text-xs font-sans">{b.phone ?? "No phone"}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Right — Message + Send */}
        <div className="space-y-4">
          <div className="bg-[#0d1321] border border-white/6 p-5">
            <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans mb-3">Template</p>
            <div className="relative">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full bg-[#0d1321] border border-white/10 text-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30 appearance-none pr-8"
              >
                {TEXT_TEMPLATES.map((t) => <option key={t.id} value={t.id} className="bg-[#0d1321] text-white">{t.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </div>

          <div className="bg-[#0d1321] border border-white/6 p-5">
            <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans mb-3">Preview</p>
            <p className="text-white/60 text-sm font-sans leading-relaxed whitespace-pre-wrap bg-white/3 border border-white/6 px-4 py-3">
              {previewText}
            </p>
          </div>

          <div className="bg-[#0d1321] border border-white/6 p-5">
            <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans mb-3">Schedule</p>
            <div className="flex gap-2 mb-3">
              {(["now", "tomorrow", "custom"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSchedule(s)}
                  className={`px-3 py-1.5 text-[11px] tracking-[0.15em] uppercase font-sans font-semibold transition-colors ${
                    schedule === s ? "bg-[#d4a853]/15 text-[#d4a853] border border-[#d4a853]/30" : "bg-white/5 text-white/40 border border-white/8 hover:bg-white/8"
                  }`}
                >
                  {s === "now" ? "Send Now" : s === "tomorrow" ? "Tomorrow 9am" : "Custom"}
                </button>
              ))}
            </div>
            {schedule === "custom" && (
              <input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-sans focus:outline-none"
              />
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={sending || selected.size === 0}
            className="w-full bg-[#d4a853] hover:bg-[#c49742] text-black py-3 text-[11px] tracking-[0.3em] uppercase font-sans font-bold disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
          >
            {sending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending {sentCount}/{selected.size}...</>
              : <><Send className="w-4 h-4" /> Send to {selected.size} business{selected.size !== 1 ? "es" : ""}</>}
          </button>
        </div>
      </div>

      {/* Sent history */}
      <div className="bg-[#0d1321] border border-white/6">
        <div className="px-6 py-4 border-b border-white/6">
          <p className="text-white/40 text-[11px] tracking-[0.25em] uppercase font-sans">Sent History</p>
        </div>
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-white/5">
              {["Business", "Method", "Message", "Date", "Status"].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-white/25 text-[10px] tracking-[0.2em] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {log.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-6 text-center text-white/20 text-sm">No messages sent yet</td></tr>
            )}
            {log.map((entry) => (
              <tr key={entry.id} className="border-b border-white/4 hover:bg-white/2">
                <td className="px-6 py-3 text-white">{entry.businesses?.name ?? "—"}</td>
                <td className="px-6 py-3 text-white/50 uppercase text-[11px] tracking-wider">{entry.method}</td>
                <td className="px-6 py-3 text-white/40 max-w-[300px] truncate text-xs">{entry.message}</td>
                <td className="px-6 py-3 text-white/35 whitespace-nowrap">
                  {new Date(entry.sent_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </td>
                <td className="px-6 py-3">
                  <span className={`text-[10px] tracking-widest uppercase font-semibold px-2 py-0.5 ${
                    entry.delivery_status === "delivered" ? "bg-emerald-900/40 text-emerald-400"
                    : entry.delivery_status === "failed" ? "bg-red-900/40 text-red-400"
                    : "bg-white/5 text-white/40"
                  }`}>
                    {entry.delivery_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
