"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Star, X, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Conversation {
  business_id: string | null;
  from_number: string;
  business_name: string | null;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id: string;
  message: string;
  direction: "inbound" | "outbound";
  created_at: string;
}

export default function ResponsesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    const { data } = await supabase
      .from("responses")
      .select("id, business_id, from_number, message, direction, created_at, businesses(name)")
      .order("created_at", { ascending: false });

    if (!data) return;

    const byPhone: Record<string, Conversation> = {};
    for (const row of data) {
      const key = row.from_number ?? row.business_id ?? "unknown";
      if (!byPhone[key]) {
        byPhone[key] = {
          business_id: row.business_id,
          from_number: row.from_number,
          business_name: (row.businesses as { name?: string } | null)?.name ?? null,
          last_message: row.message,
          last_time: row.created_at,
          unread: row.direction === "inbound" ? 1 : 0,
        };
      } else if (row.direction === "inbound") {
        byPhone[key].unread++;
      }
    }
    setConversations(Object.values(byPhone));
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  async function selectConversation(conv: Conversation) {
    setSelected(conv);
    const { data } = await supabase
      .from("responses")
      .select("id, message, direction, created_at")
      .or(`from_number.eq.${conv.from_number},to_number.eq.${conv.from_number}`)
      .order("created_at");
    setMessages((data as Message[]) ?? []);
  }

  async function sendReply() {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    try {
      await fetch("/api/send-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selected.from_number,
          message: reply,
          businessId: selected.business_id,
        }),
      });
      await supabase.from("responses").insert({
        business_id: selected.business_id,
        from_number: process.env.NEXT_PUBLIC_TWILIO_PHONE ?? "",
        to_number: selected.from_number,
        message: reply,
        direction: "outbound",
        created_at: new Date().toISOString(),
      });
      setReply("");
      await selectConversation(selected);
    } finally {
      setSending(false);
    }
  }

  async function quickAction(action: "interested" | "not_interested" | "follow_up" | "payment") {
    if (!selected) return;
    if (action === "interested" || action === "not_interested") {
      const status = action === "interested" ? "interested" : "not_interested";
      await supabase.from("businesses").update({ status }).eq("id", selected.business_id ?? "");
    } else if (action === "payment") {
      const msg = `Here's your payment link to get started: https://buy.stripe.com/your-link`;
      setReply(msg);
    }
  }

  const displayName = (conv: Conversation) => conv.business_name ?? conv.from_number;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-white font-sans font-bold text-xl">Responses</h1>
        <p className="text-white/35 text-sm font-sans mt-1">Incoming texts from prospects</p>
      </div>

      <div className="flex gap-5 h-[calc(100vh-180px)]">
        {/* Left panel — conversation list */}
        <div className="w-72 flex-shrink-0 bg-[#0d1321] border border-white/6 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/6">
            <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/4">
            {conversations.length === 0 && (
              <p className="px-4 py-6 text-white/20 text-sm font-sans text-center">No responses yet</p>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.from_number}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left px-4 py-3.5 hover:bg-white/4 transition-colors ${selected?.from_number === conv.from_number ? "bg-white/5 border-l-2 border-[#d4a853]" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-sm font-sans font-medium truncate">{displayName(conv)}</p>
                  {conv.unread > 0 && (
                    <span className="bg-[#d4a853] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <p className="text-white/35 text-xs font-sans truncate">{conv.last_message}</p>
                <p className="text-white/20 text-[10px] font-sans mt-0.5">
                  {new Date(conv.last_time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel — thread */}
        <div className="flex-1 bg-[#0d1321] border border-white/6 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-white/25 text-sm font-sans">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
                <div>
                  <p className="text-white font-sans font-semibold">{displayName(selected)}</p>
                  <p className="text-white/35 text-xs font-sans">{selected.from_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => quickAction("payment")} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4a853]/10 text-[#d4a853] text-[10px] tracking-[0.15em] uppercase font-semibold hover:bg-[#d4a853]/20 transition-colors">
                    <Send className="w-3 h-3" />Payment Link
                  </button>
                  <button onClick={() => quickAction("interested")} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/30 text-emerald-400 text-[10px] tracking-[0.15em] uppercase font-semibold hover:bg-emerald-900/50 transition-colors">
                    <Star className="w-3 h-3" />Interested
                  </button>
                  <button onClick={() => quickAction("not_interested")} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-white/40 text-[10px] tracking-[0.15em] uppercase font-semibold hover:bg-white/10 transition-colors">
                    <X className="w-3 h-3" />Not Interested
                  </button>
                  <button onClick={() => quickAction("follow_up")} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-white/40 text-[10px] tracking-[0.15em] uppercase font-semibold hover:bg-white/10 transition-colors">
                    <Clock className="w-3 h-3" />Follow Up
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 text-sm font-sans leading-relaxed ${
                      msg.direction === "outbound"
                        ? "bg-[#d4a853]/15 text-[#d4a853] border border-[#d4a853]/20"
                        : "bg-white/6 text-white/75 border border-white/8"
                    }`}>
                      <p>{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${msg.direction === "outbound" ? "text-[#d4a853]/50" : "text-white/25"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply */}
              <div className="p-4 border-t border-white/6 flex gap-3">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                  placeholder="Type a reply..."
                  className="flex-1 bg-white/5 border border-white/10 text-white placeholder:text-white/25 px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="bg-[#d4a853] hover:bg-[#c49742] text-black px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase font-sans font-semibold disabled:opacity-40 flex items-center gap-2 transition-colors"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
