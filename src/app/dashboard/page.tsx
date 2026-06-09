"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Copy, Check, ExternalLink, Loader2, CheckCircle, XCircle, Circle } from "lucide-react";

interface SiteRow {
  id: string;
  slug: string;
  business_name: string;
  status: "preview" | "sold";
  created_at: string;
  photos: string[];
}

interface ProgressStep {
  step: string;
  message: string;
  done: boolean;
  error: boolean;
}

interface Result {
  businessName: string;
  slug: string;
  previewUrl: string;
  photosCount: number;
  config: Record<string, unknown>;
}

const STEPS = ["finding", "found", "photos", "photos_done", "config", "saving"];

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  async function fetchSites() {
    const res = await fetch("/api/dashboard/sites");
    const data = await res.json();
    if (data.sites) setSites(data.sites);
  }

  async function handleGenerate() {
    if (!query.trim() || running) return;
    setRunning(true);
    setSteps([]);
    setResult(null);
    setError(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/dashboard/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            handleStreamEvent(data);
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setRunning(false);
    }
  }

  function handleStreamEvent(data: { step: string; message: string; result?: Result }) {
    if (data.step === "error") {
      setError(data.message);
      setSteps((prev) => prev.map((s) => s.step === prev[prev.length - 1]?.step ? { ...s, error: true } : s));
      return;
    }

    if (data.step === "done" && data.result) {
      setResult(data.result);
      setSteps((prev) => prev.map((s) => ({ ...s, done: true })));
      fetchSites();
      return;
    }

    setSteps((prev) => {
      const existing = prev.findIndex((s) => s.step === data.step);
      const next: ProgressStep = { step: data.step, message: data.message, done: false, error: false };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = next;
        return updated;
      }
      // Mark previous step done
      const marked = prev.map((s, i) => i === prev.length - 1 ? { ...s, done: true } : s);
      return [...marked, next];
    });
  }

  async function toggleStatus(slug: string, current: "preview" | "sold") {
    const next = current === "preview" ? "sold" : "preview";
    await fetch("/api/dashboard/update-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, status: next }),
    });
    setSites((prev) => prev.map((s) => s.slug === slug ? { ...s, status: next } : s));
  }

  function copyPreviewUrl() {
    if (!result) return;
    navigator.clipboard.writeText(result.previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyConfig() {
    if (!result) return;
    const ts = `export const businessConfig = ${JSON.stringify(result.config, null, 2)};\n`;
    navigator.clipboard.writeText(ts);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  }

  const progressMessages = [
    { key: "finding",     label: "Finding business" },
    { key: "photos",      label: "Pulling photos" },
    { key: "config",      label: "Generating config" },
    { key: "saving",      label: "Saving to database" },
  ];

  function stepStatus(key: string) {
    const found = steps.find((s) => s.step === key || (key === "photos" && s.step === "photos_done"));
    if (!found) return "pending";
    if (found.error) return "error";
    if (found.done || found.step === "photos_done") return "done";
    return "active";
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/8 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-sans font-bold text-lg tracking-tight">Mallard Creative</h1>
          <p className="text-white/35 text-xs font-sans mt-0.5">Site Generator Dashboard</p>
        </div>
        <span className="text-white/20 text-xs font-sans">{sites.length} sites generated</span>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">

        {/* Input */}
        <div className="space-y-3">
          <label className="text-white/50 text-[11px] tracking-[0.3em] uppercase font-sans">Business Name + City, or Google Maps URL</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="e.g. Primanti Brothers Pittsburgh, PA"
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 pl-11 pr-4 py-3.5 font-sans text-sm focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={running || !query.trim()}
              className="bg-white text-black px-8 py-3.5 text-[11px] tracking-[0.25em] uppercase font-sans font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              {running && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {running ? "Generating..." : "Generate Site"}
            </button>
          </div>
        </div>

        {/* Progress */}
        {(running || steps.length > 0) && !result && !error && (
          <div className="border border-white/8 p-6 space-y-3">
            {progressMessages.map(({ key, label }) => {
              const status = stepStatus(key);
              return (
                <div key={key} className="flex items-center gap-3">
                  {status === "pending"  && <Circle className="w-4 h-4 text-white/15" />}
                  {status === "active"   && <Loader2 className="w-4 h-4 text-white/60 animate-spin" />}
                  {status === "done"     && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {status === "error"    && <XCircle className="w-4 h-4 text-red-400" />}
                  <span className={`text-sm font-sans ${status === "pending" ? "text-white/25" : status === "active" ? "text-white/80" : status === "done" ? "text-white/60" : "text-red-400"}`}>
                    {label}
                    {status === "active" && "..."}
                    {key === "photos" && stepStatus(key) === "done" && steps.find(s => s.step === "photos_done") && (
                      <span className="text-white/35 ml-2">({(steps.find(s => s.step === "photos_done") as unknown as {count?: number})?.count ?? 0} photos)</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border border-red-800/50 bg-red-950/20 p-4 flex items-start gap-3">
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm font-sans">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="border border-emerald-800/40 bg-emerald-950/10 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 font-sans font-medium text-sm">Site generated successfully</span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-white/35 text-[10px] tracking-[0.3em] uppercase font-sans mb-1">Business</p>
                <p className="text-white font-sans font-medium">{result.businessName}</p>
              </div>
              <div>
                <p className="text-white/35 text-[10px] tracking-[0.3em] uppercase font-sans mb-1">Photos Pulled</p>
                <p className="text-white font-sans font-medium">{result.photosCount}</p>
              </div>
              <div>
                <p className="text-white/35 text-[10px] tracking-[0.3em] uppercase font-sans mb-1">Slug</p>
                <p className="text-white font-sans font-medium">{result.slug}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/8 px-4 py-3">
              <span className="text-white/50 text-sm font-sans flex-1 truncate">{result.previewUrl}</span>
              <a href={`/preview/${result.slug}`} target="_blank" className="text-white/40 hover:text-white transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
              <button onClick={copyPreviewUrl} className="text-white/40 hover:text-white transition-colors">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={copyConfig}
              className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-sans text-white/50 hover:text-white border border-white/10 hover:border-white/25 px-4 py-2.5 transition-colors"
            >
              {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedConfig ? "Copied!" : "Copy businessConfig.ts"}
            </button>
          </div>
        )}

        {/* Sites table */}
        {sites.length > 0 && (
          <div>
            <p className="text-white/35 text-[11px] tracking-[0.3em] uppercase font-sans mb-4">Generated Sites</p>
            <div className="border border-white/8">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-4 py-3 text-white/30 text-[10px] tracking-[0.2em] uppercase font-semibold">Business</th>
                    <th className="text-left px-4 py-3 text-white/30 text-[10px] tracking-[0.2em] uppercase font-semibold">Slug</th>
                    <th className="text-left px-4 py-3 text-white/30 text-[10px] tracking-[0.2em] uppercase font-semibold">Status</th>
                    <th className="text-left px-4 py-3 text-white/30 text-[10px] tracking-[0.2em] uppercase font-semibold">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site, i) => (
                    <tr key={site.id} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.01]" : ""} hover:bg-white/[0.03] transition-colors`}>
                      <td className="px-4 py-3 text-white font-medium">{site.business_name}</td>
                      <td className="px-4 py-3 text-white/40">{site.slug}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleStatus(site.slug, site.status)}
                          className={`text-[10px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1 transition-colors ${
                            site.status === "sold"
                              ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60"
                              : "bg-white/5 text-white/40 hover:bg-white/10"
                          }`}
                        >
                          {site.status}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-white/30">
                        {new Date(site.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/preview/${site.slug}`}
                          target="_blank"
                          className="text-white/25 hover:text-white/70 transition-colors inline-flex items-center gap-1 text-xs"
                        >
                          Preview <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
