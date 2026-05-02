"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  MapPin,
  Sparkles,
  Loader2,
  AlertCircle,
  ImageIcon,
  Wand2,
} from "lucide-react";

type Tab = "photo" | "address";

interface Result {
  report: string;
  imageBase64: string | null;
  imageError?: string | null;
}

function renderReport(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) {
        return `<h2 class="text-2xl font-display font-semibold text-white mb-3 mt-2">${line.slice(2)}</h2>`;
      }
      if (line.startsWith("## ")) {
        return `<h3 class="text-lg font-display font-semibold text-forest-300 mt-6 mb-2">${line.slice(3)}</h3>`;
      }
      if (line.startsWith("### ")) {
        return `<h4 class="text-base font-sans font-semibold text-forest-400 mt-4 mb-1">${line.slice(4)}</h4>`;
      }
      if (line.startsWith("---")) {
        return `<hr class="border-forest-700/50 my-4" />`;
      }
      const boldLine = line.replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="text-white font-semibold">$1</strong>'
      );
      if (line.startsWith("- ")) {
        return `<li class="text-white/65 text-sm leading-relaxed ml-4 list-disc font-sans">${boldLine.slice(2)}</li>`;
      }
      if (line.trim() === "") return '<div class="h-2"></div>';
      return `<p class="text-white/65 text-sm leading-relaxed font-sans">${boldLine}</p>`;
    })
    .join("");
}

export default function Visualizer() {
  const [tab, setTab] = useState<Tab>("photo");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, or WEBP).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be under 20MB.");
      return;
    }
    setImageFile(file);
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleImageSelect(file);
    },
    [handleImageSelect]
  );

  const switchTab = (t: Tab) => {
    setTab(t);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      let response: Response;

      if (tab === "photo") {
        if (!imageFile) {
          setError("Please upload a photo first.");
          setLoading(false);
          return;
        }
        const fd = new FormData();
        fd.append("image", imageFile);
        response = await fetch("/api/visualizer", { method: "POST", body: fd });
      } else {
        if (!address.trim()) {
          setError("Please enter an address.");
          setLoading(false);
          return;
        }
        response = await fetch("/api/visualizer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: address.trim() }),
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setResult({ report: data.report, imageBase64: data.imageBase64 ?? null, imageError: data.imageError ?? null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && (tab === "photo" ? !!imageFile : !!address.trim());

  return (
    <section id="visualizer" className="py-28 bg-forest-900 relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#74c69d 1px, transparent 1px), linear-gradient(90deg, #74c69d 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-5 bg-forest-800/60 border border-forest-700/50 px-5 py-2">
            <Sparkles className="w-4 h-4 text-forest-400" />
            <span className="text-forest-400 text-[11px] tracking-[0.3em] uppercase font-sans font-medium">
              Gemini AI · Gemini Imagen
            </span>
          </div>
          <h2
            className="font-display font-light text-white mb-4"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
          >
            AI Landscape Visualizer
          </h2>
          <p className="text-white/50 max-w-xl mx-auto font-sans text-[15px] leading-relaxed">
            Upload a photo or enter your address. Claude writes your personalized
            design report while Gemini Imagen renders a visual of the redesigned space.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-forest-950/60 border border-forest-700/40 p-1 gap-1">
            {(["photo", "address"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`px-8 py-3 text-[11px] tracking-[0.2em] uppercase font-sans font-medium transition-all duration-200 ${
                  tab === t ? "bg-forest-600 text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {t === "photo" ? (
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5" /> Upload Photo
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Enter Address
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Three-panel grid ── */}
        <div className="grid md:grid-cols-3 gap-6 items-start">

          {/* Panel 1 — Input */}
          <div className="bg-forest-950/40 border border-forest-700/30 p-8">
            <h3 className="font-display text-xl text-white mb-6">
              {tab === "photo" ? "Your Property" : "Property Address"}
            </h3>

            {tab === "photo" ? (
              <>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? "border-forest-400 bg-forest-700/20"
                      : "border-forest-700/60 hover:border-forest-600"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Your property" className="w-full h-48 object-cover" />
                  ) : (
                    <div className="p-10 text-center">
                      <Upload className="w-9 h-9 text-forest-600 mx-auto mb-3" />
                      <p className="font-display text-lg text-white mb-1">Drop photo here</p>
                      <p className="text-white/30 text-xs font-sans">
                        or click to browse · JPG, PNG, WEBP · 20MB max
                      </p>
                    </div>
                  )}
                </div>
                {imagePreview && (
                  <button
                    onClick={() => { setImagePreview(null); setImageFile(null); setResult(null); }}
                    className="mt-2 text-[11px] text-forest-500 hover:text-forest-400 tracking-[0.2em] uppercase font-sans transition-colors"
                  >
                    × Remove photo
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-500" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
                    placeholder="123 Main St, Austin, TX 78701"
                    className="w-full bg-forest-950/60 border border-forest-700/50 text-white placeholder-white/25 py-4 pl-12 pr-4 focus:outline-none focus:border-forest-500 text-sm font-sans transition-colors"
                  />
                </div>
                <p className="text-white/25 text-xs mt-2 font-sans leading-relaxed">
                  We&apos;ll tailor the design to your region&apos;s climate, soil, and native plants.
                </p>
              </>
            )}

            {error && (
              <div className="mt-5 flex items-start gap-3 text-red-400 text-sm bg-red-950/40 border border-red-800/50 p-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="font-sans">{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full mt-6 flex items-center justify-center gap-3 py-4 text-[11px] tracking-[0.25em] uppercase font-sans font-medium transition-all duration-200 bg-forest-600 hover:bg-forest-500 text-white disabled:bg-forest-800/50 disabled:text-white/30 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-forest-950/60"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate AI Design</>
              )}
            </button>
          </div>

          {/* Panel 2 — Gemini Generated Image */}
          <div className="bg-forest-950/40 border border-forest-700/30 p-8 min-h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Wand2 className="w-4 h-4 text-forest-400" />
              <h3 className="font-display text-xl text-white">AI Design Render</h3>
            </div>
            <p className="text-white/30 text-[11px] tracking-wider uppercase font-sans mb-4">
              Gemini Imagen
            </p>

            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 border border-forest-700/50 flex items-center justify-center mb-4">
                  <Wand2 className="w-7 h-7 text-forest-800" />
                </div>
                <p className="text-white/25 text-sm font-sans max-w-xs leading-relaxed">
                  A photorealistic render of your redesigned landscape will appear here.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="w-10 h-10 text-forest-400 animate-spin" />
                <p className="text-white/40 text-sm font-sans text-center max-w-xs">
                  Gemini is rendering your landscape vision...
                </p>
              </div>
            )}

            {result && result.imageBase64 && (
              <div className="flex-1">
                <img
                  src={`data:image/jpeg;base64,${result.imageBase64}`}
                  alt="AI-generated landscape design render"
                  className="w-full h-full object-cover"
                  style={{ minHeight: "260px" }}
                />
                <p className="text-white/20 text-[10px] font-sans mt-2 tracking-wider">
                  AI-generated render · For visualization only
                </p>
              </div>
            )}

            {result && !result.imageBase64 && (
              <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-white/25 text-xs font-sans text-center max-w-xs break-words">
                  {result.imageError || "Image generation unavailable."}
                </p>
              </div>
            )}
          </div>

          {/* Panel 3 — Claude Report */}
          <div className="bg-forest-950/40 border border-forest-700/30 p-8 min-h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-forest-400" />
              <h3 className="font-display text-xl text-white">Design Report</h3>
            </div>
            <p className="text-white/30 text-[11px] tracking-wider uppercase font-sans mb-4">
              Gemini AI
            </p>

            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 border border-forest-700/50 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-forest-800" />
                </div>
                <p className="text-white/25 text-sm font-sans max-w-xs leading-relaxed">
                  {tab === "photo"
                    ? "Your personalized landscape design report will appear here."
                    : "A location-aware design plan will appear here."}
                </p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="w-10 h-10 text-forest-400 animate-spin" />
                <p className="text-white/40 text-sm font-sans text-center max-w-xs">
                  Claude is crafting your design report...
                </p>
              </div>
            )}

            {result && (
              <div className="flex-1 overflow-y-auto scrollbar-thin pr-1" style={{ maxHeight: "520px" }}>
                <div dangerouslySetInnerHTML={{ __html: renderReport(result.report) }} />
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-white/20 text-xs font-sans mt-8 tracking-wider">
          AI-generated content is a starting point · Schedule a free consultation for a certified designer walkthrough
        </p>
      </div>
    </section>
  );
}
