"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Copy, Check, ExternalLink, Loader2, CheckCircle, XCircle, Circle, Trash2, Globe, Upload, PenLine, Images, Star, X, Plus } from "lucide-react";
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

interface ReviewEntry {
  author: string;
  rating: number;
  text: string;
  time: string;
  photo?: string;
}

interface EditModalData {
  slug: string;
  business_name: string;
  config: Record<string, unknown>;
}

type Mode = "google" | "import" | "manual";
type EditTab = "photos" | "reviews";

const GOOGLE_STEPS = ["finding", "photos", "config", "saving"];
const GOOGLE_STEP_LABELS: Record<string, string> = {
  finding: "Finding business",
  photos:  "Pulling photos",
  config:  "Generating config",
  saving:  "Saving to database",
};

const IMPORT_STEPS = ["fetching", "config", "saving"];
const IMPORT_STEP_LABELS: Record<string, string> = {
  fetching: "Fetching website",
  config:   "Generating config",
  saving:   "Saving to database",
};

const MANUAL_STEPS = ["config", "saving"];
const MANUAL_STEP_LABELS: Record<string, string> = {
  config: "Generating config",
  saving: "Saving to database",
};

const NICHES = ["landscaping","hardscape","pressure washing","painting","plumbing","electrician","lawn care","fence installation","concrete contractor","roofing","tree service","junk removal","moving company","cleaning service","HVAC","personal trainer","handyman","pool service","pest control","flooring"];

interface ManualForm { name: string; phone: string; city: string; niche: string; description: string; }

function normalizePhotoUrl(url: string): string {
  if (url.includes("lh3.googleusercontent.com")) {
    return url.replace(/=[wh]\d+[^?#\s]*/g, "=w1200");
  }
  return url;
}

export default function SitesPage() {
  const [mode,       setMode]       = useState<Mode>("google");
  const [query,      setQuery]      = useState("");
  const [manual,     setManual]     = useState<ManualForm>({ name: "", phone: "", city: "", niche: "landscaping", description: "" });
  const [running,    setRunning]    = useState(false);
  const [steps,      setSteps]      = useState<ProgressStep[]>([]);
  const [result,     setResult]     = useState<Result | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [sites,      setSites]      = useState<SiteRow[]>([]);
  const [copied,     setCopied]     = useState<string | null>(null);
  const [search,     setSearch]     = useState("");

  // Edit modal
  const [editModal,    setEditModal]    = useState<EditModalData | null>(null);
  const [editTab,      setEditTab]      = useState<EditTab>("photos");
  const [editPhotos,   setEditPhotos]   = useState("");
  const [editReviews,  setEditReviews]  = useState<ReviewEntry[]>([]);
  const [newReview,    setNewReview]    = useState<ReviewEntry>({ author: "", rating: 5, text: "", time: "" });
  const [editSaving,   setEditSaving]   = useState(false);
  const [editSaved,    setEditSaved]    = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { fetchSites(); }, []);

  async function fetchSites() {
    const { data } = await supabase
      .from("sites")
      .select("id, slug, business_name, status, created_at")
      .order("created_at", { ascending: false });
    if (data) setSites(data);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setQuery("");
    setSteps([]);
    setResult(null);
    setError(null);
  }

  const canGenerate = mode === "manual"
    ? !!(manual.name.trim() && manual.city.trim())
    : !!query.trim();

  async function handleGenerate() {
    if (!canGenerate || running) return;
    setRunning(true);
    setSteps([]);
    setResult(null);
    setError(null);
    abortRef.current = new AbortController();

    let endpoint: string;
    let body: object;
    if (mode === "manual") {
      endpoint = "/api/dashboard/manual-site";
      body = manual;
    } else if (mode === "import") {
      endpoint = "/api/dashboard/import-site";
      body = { url: query };
    } else {
      endpoint = "/api/dashboard/scrape";
      body = { query };
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });
      const reader  = res.body!.getReader();
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
            if (data.step === "done" && data.result) {
              setResult(data.result);
              setSteps((p) => p.map((s) => ({ ...s, done: true })));
              fetchSites();
              break;
            }
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
    const found = steps.find((s) =>
      s.step === key ||
      (key === "photos"   && s.step === "photos_done") ||
      (key === "fetching" && s.step === "fetching_done")
    );
    if (!found) return "pending";
    if (found.error) return "error";
    if (found.done || found.step === "photos_done" || found.step === "fetching_done") return "done";
    return "active";
  }

  async function openEdit(slug: string) {
    const { data } = await supabase
      .from("sites")
      .select("slug, business_name, config")
      .eq("slug", slug)
      .single();
    if (!data) return;
    const config = data.config as Record<string, unknown>;
    setEditModal({ slug: data.slug, business_name: data.business_name, config });
    const gallery = (config.galleryImages as Array<{ src: string }>) ?? [];
    setEditPhotos(gallery.map((g) => g.src).filter(Boolean).join("\n"));
    setEditReviews((config.reviews as ReviewEntry[]) ?? []);
    setEditTab("photos");
    setEditSaved(false);
  }

  async function savePhotos() {
    if (!editModal || editSaving) return;
    setEditSaving(true);
    setEditSaved(false);

    const urls = editPhotos
      .split("\n")
      .map((u) => normalizePhotoUrl(u.trim()))
      .filter(Boolean);

    if (urls.length === 0) { setEditSaving(false); return; }

    const config = { ...editModal.config };
    const photo0 = urls[0];
    const photo1 = urls[1] ?? photo0;
    const photo2 = urls[2] ?? photo0;
    const photo3 = urls[3] ?? photo0;

    config.aboutImage   = photo0;
    config.contactImage = photo0;
    config.galleryImages = urls.map((src, i) => ({ src, alt: `Photo ${i + 1}` }));

    if (Array.isArray(config.services)) {
      const services = (config.services as Array<Record<string, unknown>>).map((s, i) => {
        if (i === 0) return { ...s, image: photo1 };
        if (i === 1) return { ...s, image: photo2 };
        if (i === 2) return { ...s, image: photo3 };
        return s;
      });
      config.services = services;
    }

    await supabase.from("sites").update({ config, photos: urls }).eq("slug", editModal.slug);
    setEditModal({ ...editModal, config });
    setEditSaving(false);
    setEditSaved(true);
    setTimeout(() => setEditSaved(false), 2500);
  }

  async function saveReviews() {
    if (!editModal || editSaving) return;
    setEditSaving(true);
    setEditSaved(false);

    const config = { ...editModal.config, reviews: editReviews };
    await supabase.from("sites").update({ config }).eq("slug", editModal.slug);
    setEditModal({ ...editModal, config });
    setEditSaving(false);
    setEditSaved(true);
    setTimeout(() => setEditSaved(false), 2500);
  }

  function addReview() {
    if (!newReview.author.trim() || !newReview.text.trim()) return;
    setEditReviews((prev) => [
      ...prev,
      { ...newReview, time: newReview.time.trim() || "recently" },
    ]);
    setNewReview({ author: "", rating: 5, text: "", time: "" });
  }

  function removeReview(idx: number) {
    setEditReviews((prev) => prev.filter((_, i) => i !== idx));
  }

  const previewUrls = editPhotos.split("\n").map((u) => u.trim()).filter(Boolean);
  const activeSteps  = mode === "google" ? GOOGLE_STEPS  : mode === "import" ? IMPORT_STEPS  : MANUAL_STEPS;
  const activeLabels = mode === "google" ? GOOGLE_STEP_LABELS : mode === "import" ? IMPORT_STEP_LABELS : MANUAL_STEP_LABELS;
  const filtered     = sites.filter((s) => s.business_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-white font-sans font-bold text-xl">Generated Sites</h1>
        <p className="text-white/35 text-sm font-sans mt-1">Generate and manage client preview sites</p>
      </div>

      {/* Generator */}
      <div className="bg-[#0d1321] border border-white/6 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-sans">Generate New Site</p>
          {/* Mode toggle */}
          <div className="flex items-center bg-white/5 border border-white/8 p-0.5 gap-0.5">
            <button
              onClick={() => switchMode("google")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold transition-colors ${
                mode === "google" ? "bg-[#d4a853]/15 text-[#d4a853]" : "text-white/30 hover:text-white/60"
              }`}
            >
              <Globe className="w-3 h-3" />
              Google Search
            </button>
            <button
              onClick={() => switchMode("import")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold transition-colors ${
                mode === "import" ? "bg-[#d4a853]/15 text-[#d4a853]" : "text-white/30 hover:text-white/60"
              }`}
            >
              <Upload className="w-3 h-3" />
              Import URL
            </button>
            <button
              onClick={() => switchMode("manual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold transition-colors ${
                mode === "manual" ? "bg-[#d4a853]/15 text-[#d4a853]" : "text-white/30 hover:text-white/60"
              }`}
            >
              <PenLine className="w-3 h-3" />
              Manual
            </button>
          </div>
        </div>

        {mode === "import" && (
          <p className="text-white/25 text-xs font-sans mb-3">
            Paste the URL of an existing business website — Claude extracts their info and rebuilds it in your template.
          </p>
        )}

        {mode === "manual" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-sans block mb-1">Business Name *</label>
                <input
                  type="text"
                  value={manual.name}
                  onChange={(e) => setManual((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Elliott's Lawn Care"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-sans block mb-1">Phone</label>
                <input
                  type="text"
                  value={manual.phone}
                  onChange={(e) => setManual((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="(412) 555-0001"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-sans block mb-1">City, State *</label>
                <input
                  type="text"
                  value={manual.city}
                  onChange={(e) => setManual((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Pittsburgh, PA"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-sans block mb-1">Business Type *</label>
                <select
                  value={manual.niche}
                  onChange={(e) => setManual((p) => ({ ...p, niche: e.target.value }))}
                  className="w-full bg-[#0d1321] border border-white/10 text-white px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
                >
                  {NICHES.map((n) => (
                    <option key={n} value={n} className="bg-[#0d1321] text-white">{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-sans block mb-1">Extra Info (optional)</label>
              <input
                type="text"
                value={manual.description}
                onChange={(e) => setManual((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Family owned since 1998, specializes in residential, also does snow removal"
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={running || !canGenerate}
              className="bg-[#d4a853] hover:bg-[#c49742] text-black px-6 py-2.5 text-[11px] tracking-[0.25em] uppercase font-sans font-semibold disabled:opacity-40 flex items-center gap-2 transition-colors"
            >
              {running && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {running ? "Generating..." : "Generate"}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder={mode === "import" ? "https://oldwebsite.com" : "Business name + city, or paste any Google Maps link"}
              className="flex-1 bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-white/30"
            />
            <button
              onClick={handleGenerate}
              disabled={running || !canGenerate}
              className="bg-[#d4a853] hover:bg-[#c49742] text-black px-6 py-2.5 text-[11px] tracking-[0.25em] uppercase font-sans font-semibold disabled:opacity-40 flex items-center gap-2 transition-colors"
            >
              {running && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {running ? "Generating..." : "Generate"}
            </button>
          </div>
        )}

        {(running || steps.length > 0) && !result && !error && (
          <div className="mt-4 space-y-2">
            {activeSteps.map((key) => {
              const status = stepStatus(key);
              return (
                <div key={key} className="flex items-center gap-2.5">
                  {status === "pending" && <Circle className="w-3.5 h-3.5 text-white/15" />}
                  {status === "active"  && <Loader2 className="w-3.5 h-3.5 text-white/50 animate-spin" />}
                  {status === "done"    && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  {status === "error"   && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  <span className={`text-xs font-sans ${
                    status === "pending" ? "text-white/20" :
                    status === "active"  ? "text-white/70" :
                    status === "done"    ? "text-white/45" :
                    "text-red-400"
                  }`}>
                    {activeLabels[key]}{status === "active" && "..."}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-300 text-sm font-sans">
            <XCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {result && (
          <div className="mt-4 bg-emerald-950/20 border border-emerald-800/30 p-4 flex items-center justify-between">
            <div>
              <p className="text-emerald-300 text-sm font-sans font-medium">
                {result.businessName}
                {result.photosCount > 0
                  ? ` — ${result.photosCount} photo${result.photosCount !== 1 ? "s" : ""}`
                  : " — stock photos used"}
              </p>
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
                    <button onClick={() => openEdit(site.slug)} className="text-white/30 hover:text-[#d4a853] transition-colors p-1" title="Edit photos & reviews">
                      <Images className="w-3.5 h-3.5" />
                    </button>
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

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditModal(null)} />
          <div className="relative bg-[#0d1321] border border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
              <div>
                <p className="text-white font-sans font-semibold text-sm">{editModal.business_name}</p>
                <p className="text-white/30 text-[10px] font-sans mt-0.5 tracking-[0.15em] uppercase">Edit Site Content</p>
              </div>
              <button onClick={() => setEditModal(null)} className="text-white/30 hover:text-white transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/8 flex-shrink-0">
              <button
                onClick={() => setEditTab("photos")}
                className={`flex items-center gap-1.5 px-5 py-3 text-[10px] tracking-[0.2em] uppercase font-semibold font-sans transition-colors border-b-2 -mb-px ${
                  editTab === "photos"
                    ? "border-[#d4a853] text-[#d4a853]"
                    : "border-transparent text-white/35 hover:text-white/60"
                }`}
              >
                <Images className="w-3.5 h-3.5" />
                Photos
              </button>
              <button
                onClick={() => setEditTab("reviews")}
                className={`flex items-center gap-1.5 px-5 py-3 text-[10px] tracking-[0.2em] uppercase font-semibold font-sans transition-colors border-b-2 -mb-px ${
                  editTab === "reviews"
                    ? "border-[#d4a853] text-[#d4a853]"
                    : "border-transparent text-white/35 hover:text-white/60"
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                Reviews
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* ── Photos Tab ── */}
              {editTab === "photos" && (
                <div className="space-y-5">
                  <div>
                    <label className="text-white/35 text-[10px] tracking-[0.2em] uppercase font-sans block mb-2">
                      Photo URLs — one per line
                    </label>
                    <p className="text-white/20 text-xs font-sans mb-3">
                      Paste Google Business Profile photo links, or any image URL. First photo becomes the hero/about/contact image. Photos 2–4 become service card images. All photos fill the gallery.
                    </p>
                    <textarea
                      value={editPhotos}
                      onChange={(e) => setEditPhotos(e.target.value)}
                      rows={7}
                      placeholder={"https://lh3.googleusercontent.com/...\nhttps://lh3.googleusercontent.com/...\nhttps://..."}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/15 px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-white/30 resize-none"
                    />
                    <p className="text-white/20 text-[10px] font-sans mt-1.5">
                      {previewUrls.length} URL{previewUrls.length !== 1 ? "s" : ""} detected
                      {previewUrls.some((u) => u.includes("lh3.googleusercontent.com")) && " · Google URLs auto-upgraded to w1200"}
                    </p>
                  </div>

                  {/* Thumbnails preview */}
                  {previewUrls.length > 0 && (
                    <div>
                      <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase font-sans mb-2">Preview</p>
                      <div className="grid grid-cols-4 gap-2">
                        {previewUrls.slice(0, 8).map((url, i) => (
                          <div key={i} className="aspect-square bg-white/5 border border-white/8 overflow-hidden relative">
                            <img
                              src={normalizePhotoUrl(url)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                            />
                            <span className="absolute bottom-1 left-1 text-white/60 text-[9px] bg-black/60 px-1">
                              {i === 0 ? "hero" : i <= 2 ? `svc ${i}` : `gal ${i}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Reviews Tab ── */}
              {editTab === "reviews" && (
                <div className="space-y-5">
                  {/* Existing reviews */}
                  {editReviews.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-white/35 text-[10px] tracking-[0.2em] uppercase font-sans mb-3">
                        {editReviews.length} Review{editReviews.length !== 1 ? "s" : ""}
                      </p>
                      {editReviews.map((r, i) => (
                        <div key={i} className="bg-white/3 border border-white/6 p-3 flex gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white text-xs font-sans font-medium">{r.author}</span>
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map((n) => (
                                  <Star key={n} className={`w-2.5 h-2.5 ${n <= r.rating ? "text-[#d4a853] fill-[#d4a853]" : "text-white/20"}`} />
                                ))}
                              </div>
                              <span className="text-white/25 text-[10px] font-sans">{r.time}</span>
                            </div>
                            <p className="text-white/50 text-xs font-sans leading-relaxed line-clamp-2">{r.text}</p>
                          </div>
                          <button
                            onClick={() => removeReview(i)}
                            className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add review form */}
                  <div className="border border-white/8 p-4 space-y-3">
                    <p className="text-white/35 text-[10px] tracking-[0.2em] uppercase font-sans">Add Review</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/25 text-[10px] tracking-[0.15em] uppercase font-sans block mb-1">Reviewer Name</label>
                        <input
                          type="text"
                          value={newReview.author}
                          onChange={(e) => setNewReview((p) => ({ ...p, author: e.target.value }))}
                          placeholder="John D."
                          className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-3 py-2 text-xs font-sans focus:outline-none focus:border-white/30"
                        />
                      </div>
                      <div>
                        <label className="text-white/25 text-[10px] tracking-[0.15em] uppercase font-sans block mb-1">Rating</label>
                        <select
                          value={newReview.rating}
                          onChange={(e) => setNewReview((p) => ({ ...p, rating: Number(e.target.value) }))}
                          className="w-full bg-[#0d1321] border border-white/10 text-white px-3 py-2 text-xs font-sans focus:outline-none focus:border-white/30"
                        >
                          {[5,4,3,2,1].map((n) => (
                            <option key={n} value={n} className="bg-[#0d1321]">{"★".repeat(n)} ({n} stars)</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-white/25 text-[10px] tracking-[0.15em] uppercase font-sans block mb-1">Review Text</label>
                      <textarea
                        value={newReview.text}
                        onChange={(e) => setNewReview((p) => ({ ...p, text: e.target.value }))}
                        rows={3}
                        placeholder="They did an amazing job on our yard..."
                        className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-3 py-2 text-xs font-sans focus:outline-none focus:border-white/30 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/25 text-[10px] tracking-[0.15em] uppercase font-sans block mb-1">Date Label <span className="text-white/15 normal-case tracking-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={newReview.time}
                        onChange={(e) => setNewReview((p) => ({ ...p, time: e.target.value }))}
                        placeholder="2 months ago"
                        className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-3 py-2 text-xs font-sans focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <button
                      onClick={addReview}
                      disabled={!newReview.author.trim() || !newReview.text.trim()}
                      className="flex items-center gap-1.5 bg-white/8 hover:bg-white/12 text-white/70 px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-sans font-semibold disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add to list
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/8 flex-shrink-0">
              <a
                href={`/preview/${editModal.slug}`}
                target="_blank"
                className="text-white/30 hover:text-white/60 text-xs font-sans flex items-center gap-1 transition-colors"
              >
                View site <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex items-center gap-3">
                {editSaved && (
                  <span className="text-emerald-400 text-xs font-sans flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
                <button
                  onClick={() => setEditModal(null)}
                  className="text-white/35 hover:text-white/60 px-4 py-2 text-[10px] tracking-[0.2em] uppercase font-sans font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={editTab === "photos" ? savePhotos : saveReviews}
                  disabled={editSaving}
                  className="bg-[#d4a853] hover:bg-[#c49742] text-black px-5 py-2 text-[10px] tracking-[0.2em] uppercase font-sans font-semibold disabled:opacity-40 flex items-center gap-1.5 transition-colors"
                >
                  {editSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                  {editSaving ? "Saving..." : `Save ${editTab === "photos" ? "Photos" : "Reviews"}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
