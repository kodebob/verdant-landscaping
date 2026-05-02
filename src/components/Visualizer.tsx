"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface Result {
  imageBase64: string;
  mimeType: string;
  description: string;
}

export default function Visualizer() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const reset = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!imageFile) return;
    setError(null);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      const response = await fetch("/api/visualizer", { method: "POST", body: fd });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      if (!data.imageBase64) throw new Error(data.error || "No image was returned. Please try again.");
      setResult({ imageBase64: data.imageBase64, mimeType: data.mimeType ?? "image/jpeg", description: data.description ?? "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="visualizer" className="py-28 bg-forest-900 relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#74c69d 1px, transparent 1px), linear-gradient(90deg, #74c69d 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-5 bg-forest-800/60 border border-forest-700/50 px-5 py-2">
            <Sparkles className="w-4 h-4 text-forest-400" />
            <span className="text-forest-400 text-[11px] tracking-[0.3em] uppercase font-sans font-medium">
              Powered by Gemini AI
            </span>
          </div>
          <h2
            className="font-display font-light text-white mb-4"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
          >
            AI Landscape Visualizer
          </h2>
          <p className="text-white/50 max-w-lg mx-auto font-sans text-[15px] leading-relaxed">
            Upload a photo of your home and Gemini AI will generate a realistic
            before &amp; after showing your transformed landscape.
          </p>
        </div>

        {/* ── Upload state ── */}
        {!result && !loading && (
          <div className="max-w-2xl mx-auto">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => !imagePreview && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed transition-all duration-200 ${
                imagePreview ? "cursor-default" : "cursor-pointer"
              } ${
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
                <img
                  src={imagePreview}
                  alt="Your property"
                  className="w-full object-cover"
                  style={{ maxHeight: "520px" }}
                />
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 border border-forest-700/50 flex items-center justify-center mx-auto mb-5">
                    <Upload className="w-7 h-7 text-forest-600" />
                  </div>
                  <p className="font-display text-xl text-white mb-2">Drop your photo here</p>
                  <p className="text-white/30 text-sm font-sans mb-1">or click to browse</p>
                  <p className="text-white/20 text-xs font-sans">JPG, PNG, WEBP · Max 20MB</p>
                </div>
              )}
            </div>

            {imagePreview && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-3 py-4 text-[11px] tracking-[0.25em] uppercase font-sans font-medium bg-forest-600 hover:bg-forest-500 text-white transition-all duration-200 hover:shadow-xl hover:shadow-forest-950/60"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate AI Redesign
                </button>
                <button
                  onClick={reset}
                  className="px-5 py-4 border border-forest-700/50 text-white/40 hover:text-white/70 hover:border-forest-600 transition-colors"
                  title="Remove photo"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-5 flex items-start gap-3 text-red-400 text-sm bg-red-950/40 border border-red-800/50 p-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="font-sans">{error}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-6">
            <Loader2 className="w-12 h-12 text-forest-400 animate-spin" />
            <div className="text-center">
              <p className="text-white font-display text-xl mb-2">Gemini is redesigning your landscape…</p>
              <p className="text-white/40 text-sm font-sans">This takes about 20–30 seconds</p>
            </div>
          </div>
        )}

        {/* ── Result: Before / After ── */}
        {result && !loading && (
          <div>
            {/* Before / After grid */}
            <div className="grid md:grid-cols-2 gap-2 mb-8">

              {/* Before */}
              <div className="relative">
                <div className="absolute top-5 left-5 z-10 bg-forest-950/85 backdrop-blur-sm px-5 py-2">
                  <span className="text-white text-[11px] tracking-[0.35em] uppercase font-sans font-medium">Before</span>
                </div>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Original property"
                    className="w-full object-cover"
                    style={{ height: "580px" }}
                  />
                )}
              </div>

              {/* After */}
              <div className="relative">
                <div className="absolute top-5 left-5 z-10 bg-forest-600/90 backdrop-blur-sm px-5 py-2">
                  <span className="text-white text-[11px] tracking-[0.35em] uppercase font-sans font-medium">After Your K&amp;M Redesign</span>
                </div>
                <img
                  src={`data:${result.mimeType};base64,${result.imageBase64}`}
                  alt="AI-generated landscape redesign"
                  className="w-full object-cover"
                  style={{ height: "580px" }}
                />
              </div>
            </div>

            {/* Description */}
            {result.description && (
              <div className="max-w-2xl mx-auto text-center mb-10">
                <p className="text-white/60 font-sans text-[15px] leading-relaxed">{result.description}</p>
                <p className="text-white/20 text-[10px] font-sans mt-3 tracking-wider uppercase">
                  AI-generated visualization · Results may vary
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-3 bg-forest-600 hover:bg-forest-500 text-white px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-sans font-medium transition-all duration-300 hover:shadow-2xl hover:shadow-forest-950/70 hover:-translate-y-0.5"
              >
                Book a Free Consultation to Make This Real
              </a>
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 border border-forest-700/50 text-white/50 hover:text-white/80 hover:border-forest-600 px-8 py-4 text-[11px] tracking-[0.2em] uppercase font-sans font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Another Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
