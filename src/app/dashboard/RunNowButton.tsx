"use client";

import { useState } from "react";
import { Play, Loader2, Check } from "lucide-react";

interface Props {
  niche: string;
  city: string;
}

export default function RunNowButton({ niche, city }: Props) {
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [result, setResult] = useState<{ businessesFound?: number } | null>(null);

  async function run() {
    if (state === "running") return;
    setState("running");
    setResult(null);
    try {
      const res = await fetch("/api/cron/daily");
      const data = await res.json();
      setResult(data);
      setState("done");
      setTimeout(() => setState("idle"), 5000);
    } catch {
      setState("idle");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={run}
        disabled={state === "running"}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 text-[11px] tracking-[0.25em] uppercase font-sans font-bold transition-colors"
      >
        {state === "running" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {state === "done"    && <Check className="w-3.5 h-3.5" />}
        {state === "idle"    && <Play className="w-3.5 h-3.5" />}
        {state === "running" ? "Running..." : state === "done" ? "Done" : "Run Now"}
      </button>
      <p className="text-white/25 text-[10px] font-sans">
        {state === "done" && result?.businessesFound !== undefined
          ? `Found ${result.businessesFound} businesses`
          : `Today: ${niche} · ${city}`}
      </p>
    </div>
  );
}
