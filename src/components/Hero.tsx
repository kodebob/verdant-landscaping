"use client";

import { useState, useEffect, useRef } from "react";

const VIDEOS = [
  "https://trbxniwzpsf1hxso.public.blob.vercel-storage.com/4544137-hd_1920_1080_30fps.mp4",
  "https://trbxniwzpsf1hxso.public.blob.vercel-storage.com/17045602-hd_1920_1080_50fps.mp4",
  "https://trbxniwzpsf1hxso.public.blob.vercel-storage.com/15473106_1080_1920_30fps.mp4",
  "https://trbxniwzpsf1hxso.public.blob.vercel-storage.com/15634486_3840_2160_60fps.mp4",
  "https://trbxniwzpsf1hxso.public.blob.vercel-storage.com/9477579-uhd_3840_2160_24fps.mp4",
];

const PLAY_DURATION = 9000;  // longer play gives heavy videos more buffer time
const FADE_DURATION = 1200;
const PRELOAD_AHEAD = 5000; // start loading next video 5s before transition

export default function Hero() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = (from: number) => {
    const next = (from + 1) % VIDEOS.length;
    const afterNext = (from + 2) % VIDEOS.length;
    const incoming = videoRefs.current[next];

    const doTransition = () => {
      setNextIdx(next);
      setTransitioning(true);
      incoming?.play().catch(() => {});

      setTimeout(() => {
        const outgoing = videoRefs.current[from];
        if (outgoing) { outgoing.pause(); outgoing.currentTime = 0; }
        setCurrentIdx(next);
        setTransitioning(false);

        // Start loading the one after next only after transition completes
        const queued = videoRefs.current[afterNext];
        if (queued && queued.preload === "none") queued.load();
      }, FADE_DURATION);
    };

    if (!incoming) { doTransition(); return; }

    incoming.currentTime = 0;

    // Wait until the browser has buffered enough to play smoothly
    if (incoming.readyState >= 3) {
      doTransition();
    } else {
      incoming.load();
      incoming.addEventListener("canplay", doTransition, { once: true });
    }
  };

  useEffect(() => {
    const current = videoRefs.current[currentIdx];
    if (current) {
      current.currentTime = 0;
      current.play().catch(() => {});
    }

    // Begin loading next video well ahead of transition
    preloadRef.current = setTimeout(() => {
      const next = (currentIdx + 1) % VIDEOS.length;
      const el = videoRefs.current[next];
      if (el && el.readyState === 0) el.load();
    }, PLAY_DURATION - PRELOAD_AHEAD);

    timerRef.current = setTimeout(() => advance(currentIdx), PLAY_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (preloadRef.current) clearTimeout(preloadRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  const jumpTo = (i: number) => {
    if (transitioning || i === currentIdx) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (preloadRef.current) clearTimeout(preloadRef.current);
    advance(currentIdx);
    setNextIdx(i);
  };

  return (
    <section
      id="hero"
      className="relative h-screen min-h-[640px] overflow-hidden flex items-center justify-center"
    >
      {/* ── Solid dark fallback (always behind everything) ── */}
      <div className="absolute inset-0 bg-forest-950" />

      {/* ── Video stack — all 5 elements, only 2 ever visible ── */}
      {VIDEOS.map((src, i) => {
        const isCurrent = i === currentIdx;
        const isNext = transitioning && i === nextIdx;
        const visible = isCurrent || isNext;

        return (
          <video
            key={src}
            ref={(el) => { videoRefs.current[i] = el; }}
            src={src}
            muted
            playsInline
            preload={i === 0 ? "auto" : "none"}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: isNext ? 1 : isCurrent ? (transitioning ? 0 : 1) : 0,
              transition: visible ? `opacity ${FADE_DURATION}ms ease-in-out` : "none",
              zIndex: isNext ? 2 : isCurrent ? 1 : 0,
            }}
          />
        );
      })}

      {/* ── Overlays — layered for depth and readability ── */}

      {/* Base dark green tint over the whole frame */}
      <div
        className="absolute inset-0 bg-forest-950/55"
        style={{ zIndex: 3 }}
      />

      {/* Darker vignette — top and bottom edges */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 4,
          background:
            "linear-gradient(to bottom, rgba(6,26,15,0.65) 0%, rgba(6,26,15,0.15) 35%, rgba(6,26,15,0.15) 65%, rgba(6,26,15,0.80) 100%)",
        }}
      />

      {/* Left-side subtle darkening so logo area is always readable */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 5,
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(6,26,15,0.35) 100%)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative text-center px-6 max-w-5xl mx-auto" style={{ zIndex: 10 }}>
        <p className="text-forest-300 text-[10px] tracking-[0.5em] uppercase mb-6 font-sans font-medium drop-shadow-lg">
          Premium Landscape Design &amp; Care
        </p>

        <h1
          className="font-sans font-extrabold text-white uppercase tracking-tight leading-none mb-6"
          style={{
            fontSize: "clamp(3rem, 9vw, 8rem)",
            textShadow: "0 4px 40px rgba(0,0,0,0.5)",
          }}
        >
          K&amp;M Landscaping
        </h1>

        <p
          className="font-sans text-white/65 font-light mb-12 leading-relaxed"
          style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
        >
          Where nature meets artistry —<br className="hidden sm:block" />
          transforming outdoor spaces into living masterpieces.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#contact"
            className="bg-forest-600 hover:bg-forest-500 text-white px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-sans font-medium transition-all duration-300 hover:shadow-2xl hover:shadow-forest-950/70 hover:-translate-y-0.5"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
          >
            Book Free Consultation
          </a>
          <a
            href="#visualizer"
            className="border border-white/55 hover:border-white/90 hover:bg-white/10 text-white px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-sans font-medium transition-all duration-300 backdrop-blur-sm"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
          >
            AI Design Preview
          </a>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ zIndex: 10 }}
      >
        <span className="text-white/45 text-[10px] tracking-[0.4em] uppercase font-sans">
          Scroll
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent" />
      </div>

      {/* ── Video progress dots ── */}
      <div
        className="absolute bottom-10 right-8 flex items-center gap-2"
        style={{ zIndex: 10 }}
      >
        {VIDEOS.map((_, i) => (
          <button
            key={i}
            onClick={() => jumpTo(i)}
            aria-label={`Video ${i + 1}`}
            className="transition-all duration-400 rounded-full"
            style={{
              width: i === currentIdx ? "24px" : "6px",
              height: "6px",
              background: i === currentIdx ? "rgba(116,198,157,0.9)" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
