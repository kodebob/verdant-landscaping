"use client";

import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { X } from "lucide-react";

const images = [
  {
    src: "/images/tmpcom88ubb.webp",
    alt: "Luxury stone home with curved driveway and professionally landscaped beds",
  },
  {
    src: "/images/primms-landscaping-llc-gallery-home-014-1920w.webp",
    alt: "Brick home with fresh mulch beds, flowering plants, and stone-edged walkway",
  },
  {
    src: "/images/tmpcauhvsjm.webp",
    alt: "Ranch home with flowering redbud tree and fresh mulch landscape beds",
  },
  {
    src: "/images/primms-landscaping-llc-gallery-home-016-1920w.webp",
    alt: "Ranch-style home with evergreen shrubs and manicured landscape beds",
  },
  {
    src: "/images/e0cabf_033422d1ab3a430ab3de8bd790435dac~mv2.avif",
    alt: "Professionally landscaped residential property",
  },
  {
    src: "/images/e0cabf_42b832a1201443d8891508d374523d44~mv2.avif",
    alt: "Landscaped garden beds and lawn care",
  },
  {
    src: "/images/e0cabf_54764b87c3ca40648b29e222326fef29~mv2.avif",
    alt: "Premium residential landscaping project",
  },
  {
    src: "/images/e0cabf_6e2b05db654241579e776d6e10094017~mv2.avif",
    alt: "Outdoor living space and landscape design",
  },
  {
    src: "/images/e0cabf_803c8f34c0124dcf911d3ea4f33be784~mv2.avif",
    alt: "Seasonal planting and lawn maintenance",
  },
  {
    src: "/images/e0cabf_b8b92f6e315b4b52b1079282e3223847~mv2.avif",
    alt: "Hardscape and planting bed installation",
  },
  {
    src: "/images/e0cabf_ccaae962cfe24712968bba44407340fb~mv2.avif",
    alt: "Residential landscape design and installation",
  },
];

export default function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const { ref, inView } = useInView({ threshold: 0.05, triggerOnce: true });

  const openLightbox = (i: number) => setLightbox(i);
  const closeLightbox = () => setLightbox(null);
  const prev = () => setLightbox((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  const next = () => setLightbox((i) => (i !== null ? (i + 1) % images.length : null));

  return (
    <>
      <section id="gallery" ref={ref} className="py-28 bg-forest-950">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-forest-400 text-[11px] tracking-[0.4em] uppercase mb-5 font-sans font-medium">
              Our Work
            </p>
            <h2
              className="font-display font-light text-white"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
            >
              Portfolio
            </h2>
          </div>

          {/* Masonry-style grid */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {images.map((img, i) => (
              <div
                key={img.src}
                onClick={() => openLightbox(i)}
                className={`break-inside-avoid group relative overflow-hidden cursor-pointer transition-all duration-700 ease-out ${
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${(i % 8) * 60}ms` }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-forest-900/0 group-hover:bg-forest-900/50 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/60 px-5 py-2">
                    <span className="text-white text-[10px] tracking-[0.3em] uppercase font-sans">
                      View
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-forest-950/97 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 md:left-8 text-white/50 hover:text-white transition-colors text-4xl font-light z-10 select-none"
            aria-label="Previous"
          >
            ‹
          </button>

          {/* Image */}
          <div
            className="max-w-5xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightbox].src}
              alt={images[lightbox].alt}
              className="w-full h-full object-contain max-h-[85vh]"
            />
            <p className="text-white/30 text-xs font-sans text-center mt-4 tracking-wider">
              {lightbox + 1} / {images.length}
            </p>
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 md:right-8 text-white/50 hover:text-white transition-colors text-4xl font-light z-10 select-none"
            aria-label="Next"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
