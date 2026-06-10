"use client";

import { useState, useRef } from "react";
import { Search, Loader2, Globe, Phone, MapPin, Zap, Plus } from "lucide-react";

const NICHES = ["Hardscape", "Landscaping", "Pressure Washing", "Painting", "Plumbing", "Electrician", "Personal Trainer", "Barber", "Food Truck", "Other"];
const COUNTS = [25, 50, 100, 200];
const FILTERS = [
  { value: "none", label: "No Website Only" },
  { value: "bad",  label: "Bad Website (< 60 score)" },
  { value: "both", label: "Both" },
  { value: "all",  label: "Show All" },
] as const;

interface Business {
  place_id: string;
  name: string;
  phone: string | null;
  address: string;
  has_website: boolean;
  website: string | null;
  website_score: number | null;
}

export default function FindPage() {
  const [niche, setNiche] = useState("Landscaping");
  const [city, setCity] = useState("");
  const [count, setCount] = useState(25);
  const [filter, setFilter] = useState<"none" | "bad" | "both" | "all">("none");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingSite, setGeneratingSite] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleFind() {
    if (!city.trim() || running) return;
    setRunning(true);
    setResults([]);
    setTotal(null);
    setError(null);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/find-businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, city, count, filter }),
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
            if (data.type === "total") setTotal(data.count);
            else if (data.type === "result") setResults((p) => [...p, data]);
            else if (data.type === "error") setError(data.message);
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function generateSite(business: Business) {
    setGeneratingSite(business.place_id);
    try {
      const res = await fetch("/api/dashboard/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `${business.name} ${business.address}` }),
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
            if (data.step === "done" && data.result?.previewUrl) {
              window.open(data.result.previewUrl.replace("https://preview.mallardcreative.net", ""), "_blank");
            }
          } catch {}
        }
      }
    } finally {
      setGeneratingSite(null);
    }
  }

  async function addToOutreach(business: Business) {
    await fetch("/api/dashboard/outreach/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: business.name, phone: business.phone, address: business.address }),
    });
    alert(`${business.name} added to outreach queue`);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-white font-sans font-bold text-xl">Find Businesses</h1>
        <p className="text-white/35 text-sm font-sans mt-1">Search Google Places for local prospects</p>
      </div>

      {/* Form */}
      <div className="bg-[#0d1321] border border-white/6 p-6 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans block mb-1.5">Niche</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
            >
              {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans block mb-1.5">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFind()}
              placeholder="Pittsburgh, PA"
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans block mb-1.5">Count</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
            >
              {COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-sans block mb-1.5">Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
            >
              {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={handleFind}
          disabled={running || !city.trim()}
          className="bg-[#d4a853] hover:bg-[#c49742] text-black px-8 py-2.5 text-[11px] tracking-[0.25em] uppercase font-sans font-semibold disabled:opacity-40 flex items-center gap-2 transition-colors"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          {running ? "Searching..." : "Find Businesses"}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800/40 text-red-300 text-sm font-sans px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Results */}
      {(results.length > 0 || running) && (
        <div className="bg-[#0d1321] border border-white/6">
          <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
            <p className="text-white/40 text-[11px] tracking-[0.25em] uppercase font-sans">
              Results
              {total !== null && <span className="text-white/20 ml-2">({results.length} / {total})</span>}
            </p>
            {running && <Loader2 className="w-4 h-4 animate-spin text-white/30" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-white/5">
                  {["Business", "Phone", "Website", "Score", "Address", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-white/25 text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((b) => (
                  <tr key={b.place_id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{b.name}</td>
                    <td className="px-4 py-3 text-white/50 whitespace-nowrap">
                      {b.phone
                        ? <a href={`tel:${b.phone}`} className="flex items-center gap-1 hover:text-white"><Phone className="w-3 h-3" />{b.phone}</a>
                        : <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {b.has_website
                        ? <a href={b.website!} target="_blank" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"><Globe className="w-3 h-3" />Yes</a>
                        : <span className="text-white/25">No</span>}
                    </td>
                    <td className="px-4 py-3">
                      {b.website_score !== null
                        ? <span className={`text-xs font-semibold px-1.5 py-0.5 ${b.website_score < 50 ? "bg-red-900/40 text-red-400" : b.website_score < 70 ? "bg-amber-900/40 text-amber-400" : "bg-emerald-900/40 text-emerald-400"}`}>{b.website_score}</span>
                        : <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3 text-white/40 max-w-[200px] truncate">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{b.address}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateSite(b)}
                          disabled={generatingSite === b.place_id}
                          className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase font-semibold px-2.5 py-1.5 bg-[#d4a853]/10 text-[#d4a853] hover:bg-[#d4a853]/20 transition-colors disabled:opacity-50"
                        >
                          {generatingSite === b.place_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          Generate
                        </button>
                        <button
                          onClick={() => addToOutreach(b)}
                          className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase font-semibold px-2.5 py-1.5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Outreach
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
