"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Copy, Check, ExternalLink, Loader2, CheckCircle, XCircle, Circle, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SiteRow {
  id: string;
  slug: string;
  business_name: string;
  status: "preview" | "sold";
  created_at: string;
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
}

const STEPS = ["finding", "photos", "config", "saving"];

const STEP_LABELS: Record<string, string> = {
  finding: "Finding business",
  photos:  "Pulling photos",
  config:  "Generating config",
  saving:  "Saving to database",
};

export default function SitesPage() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { fetchSites(); }, []);

  async function fetchSites() {
    const { data } = await supabase
      .from("sites")
      .select("id, slug, business_name, status, created_at")
      .order("created_at", { ascending: false });
    if (data) setSites(data);
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
      const reader = res.body!.getReader();
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
            if (data.step === "error") { setError(data.message); break; }
            if (data.step === "done" && data.result) { setResult(data.result); setSteps((p) => p.map((s) => ({ ...s, done: true }))); fetchSites(); break; }
            setSteps((prev) => {
              const next: ProgressStep = { step: data.step, message: data.message, done: false, error: false };
              const idx = prev.findIndex((s) => s.step === data.step);
              if (idx >= 0) { const u = [...prev]; u[idx] = next; return u; }
              return [...prev.map((s, i) => i === prev.length - 1 ? { ...s, done: true } : s), next];
            });
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function toggleStatus(slug: string, current: "preview" | "sold") {
    const next = current === "preview" ? "sold" : "preview";
    await supabase.from("sites").update({ status: next }).eq("slug", slug);
    setSites((p) => p.map((s) => s.slug === slug ? { ...s, status: next } : s));
  }

  async function deleteSite(id: string) {
    if (!confirm("Delete this site?")) return;
    await supabase.from("sites").delete().eq("id", id);
    setSites((p) => p.filter((s) => s.id !== id));
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`https://preview.mallardcreative.net/preview/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  }

  function stepStatus(key: string) {
    const found = steps.find((s) => s.step === key || (key === "photos" && s.step === "photos_done"));
    if (!found) return "pending";
    if (found.error) return "error";
    if (found.done || found.step === "photos_done") return "done";
    return "active";
  }

  const filtered = sites.filter((s) =>
    s.business_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-white font-sans font-bold text-xl">Generated Sites</h1>
        <p className="text-white/35 text-sm font-sans mt-1">Generate and manage client preview sites</p>
      </div>

      {/* Generator */}
      <div className="bg-[#0d1321] border border-white/6 p-6 mb-6">
        <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-sans mb-3">Generate New Site</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Business name + city, or Google Maps URL"
            className="flex-1 bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
          />
          <button
            onClick={handleGenerate}
            disabled={running || !query.trim()}
            className="bg-[#d4a853] hover:bg-[#c49742] text-black px-6 py-2.5 text-[11px] tracking-[0.25em] uppercase font-sans font-semibold disabled:opacity-40 flex items-center gap-2 transition-colors"
          >
            {running && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {running ? "Generating..." : "Generate"}
          </button>
        </div>

        {(running || steps.length > 0) && !result && !error && (
          <div className="mt-4 space-y-2">
            {STEPS.map((key) => {
              const status = stepStatus(key);
              return (
                <div key={key} className="flex items-center gap-2.5">
                  {status === "pending" && <Circle className="w-3.5 h-3.5 text-white/15" />}
                  {status === "active"  && <Loader2 className="w-3.5 h-3.5 text-white/50 animate-spin" />}
                  {status === "done"    && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  {status === "error"   && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  <span className={`text-xs font-sans ${status === "pending" ? "text-white/20" : status === "active" ? "text-white/70" : status === "done" ? "text-white/45" : "text-red-400"}`}>
                    {STEP_LABELS[key]}{status === "active" && "..."}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-300 text-sm font-sans">
            <XCircle className="w-4 h-4" />{error}
          </div>
        )}

        {result && (
          <div className="mt-4 bg-emerald-950/20 border border-emerald-800/30 p-4 flex items-center justify-between">
            <div>
              <p className="text-emerald-300 text-sm font-sans font-medium">{result.businessName} — {result.photosCount} photos</p>
              <p className="text-white/40 text-xs font-sans mt-0.5">{result.previewUrl}</p>
            </div>
            <div className="flex gap-2">
              <a href={`/preview/${result.slug}`} target="_blank" className="text-white/40 hover:text-white p-1.5 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
              <button onClick={() => copyLink(result.slug)} className="text-white/40 hover:text-white p-1.5 transition-colors">
                {copied === result.slug ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#0d1321] border border-white/6">
        <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between gap-4">
          <p className="text-white/40 text-[11px] tracking-[0.25em] uppercase font-sans whitespace-nowrap">
            {sites.length} sites
          </p>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full bg-white/5 border border-white/8 text-white placeholder:text-white/20 pl-8 pr-3 py-2 text-xs font-sans focus:outline-none focus:border-white/25"
            />
          </div>
        </div>
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-white/5">
              {["Business", "Preview URL", "Status", "Created", "Actions"].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-white/25 text-[10px] tracking-[0.2em] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-white/20 text-sm">No sites yet</td></tr>
            )}
            {filtered.map((site) => (
              <tr key={site.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                <td className="px-6 py-3 text-white font-medium">{site.business_name}</td>
                <td className="px-6 py-3">
                  <a
                    href={`/preview/${site.slug}`}
                    target="_blank"
                    className="text-white/40 hover:text-white/70 text-xs font-sans flex items-center gap-1 transition-colors"
                  >
                    {site.slug} <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => toggleStatus(site.slug, site.status)}
                    className={`text-[10px] tracking-[0.15em] uppercase font-semibold px-2 py-1 transition-colors ${
                      site.status === "sold"
                        ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60"
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    {site.status}
                  </button>
                </td>
                <td className="px-6 py-3 text-white/35">
                  {new Date(site.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyLink(site.slug)} className="text-white/30 hover:text-white/70 transition-colors p-1">
                      {copied === site.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => deleteSite(site.id)} className="text-white/30 hover:text-red-400 transition-colors p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
