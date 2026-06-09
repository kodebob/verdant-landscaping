"use client";

import { Star } from "lucide-react";
import { useBusinessConfig } from "@/config/useBusinessConfig";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" aria-label="Google">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function ReviewTicker() {
  const config = useBusinessConfig();
  const reviews = config.reviews ?? [];
  if (!reviews.length) return null;

  // Repeat until we have at least 10 items, then double for seamless loop
  const minCount = 10;
  const repeated = Array.from(
    { length: Math.ceil(minCount / reviews.length) },
    () => reviews
  ).flat();
  const looped = [...repeated, ...repeated];

  return (
    <section className="bg-forest-950 py-12 overflow-hidden border-b border-white/5">
      <div className="mb-8 text-center">
        <p className="text-white/30 text-[10px] tracking-[0.45em] uppercase font-sans">
          Verified Google Reviews
        </p>
      </div>

      {/* Fade edges */}
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-32 z-10"
          style={{ background: "linear-gradient(to right, var(--brand-950), transparent)" }} />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 z-10"
          style={{ background: "linear-gradient(to left, var(--brand-950), transparent)" }} />

        <div className="review-ticker flex gap-5" style={{ width: "max-content" }}>
          {looped.map((review, i) => (
            <div
              key={i}
              className="w-[300px] flex-shrink-0 bg-white/5 border border-white/8 px-6 py-5 flex flex-col gap-3 hover:bg-white/8 hover:border-white/15 transition-colors cursor-default"
            >
              <div className="flex items-center justify-between">
                <Stars rating={review.rating} />
                <GoogleIcon />
              </div>

              <p className="text-white/60 text-[13px] leading-snug font-sans line-clamp-3">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="flex items-center gap-2.5 mt-auto pt-2 border-t border-white/6">
                {review.photo ? (
                  <img
                    src={review.photo}
                    alt={review.author}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-forest-800 flex items-center justify-center text-forest-300 font-sans font-semibold text-xs flex-shrink-0">
                    {review.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white/70 text-xs font-sans font-medium truncate">{review.author}</p>
                  <p className="text-white/30 text-[11px] font-sans">{review.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
