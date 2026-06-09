"use client";

import { Star } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useBusinessConfig } from "@/config/useBusinessConfig";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-100 text-gray-100"
          }`}
        />
      ))}
    </div>
  );
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-label="Google">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Reviews() {
  const config = useBusinessConfig();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  const reviews = config.reviews ?? [];
  if (!reviews.length) return null;

  const overallRating = config.stats.find(
    (s) => s.label.toLowerCase().includes("rating")
  )?.value ?? "5.0★";

  const reviewCount = config.stats.find(
    (s) => s.label.toLowerCase().includes("customer")
  )?.value;

  return (
    <section id="reviews" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-14">
          <p className="text-forest-600 text-[11px] tracking-[0.4em] uppercase mb-5 font-sans font-medium">
            Google Reviews
          </p>
          <h2
            className="font-display font-light text-forest-900 mb-4"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
          >
            What Clients Say
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-gray-400 text-sm font-sans">
              {overallRating} · {reviewCount ? `${reviewCount} happy customers` : "Verified Google Reviews"}
            </span>
          </div>
        </div>

        <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review, i) => (
            <div
              key={i}
              className={`flex flex-col gap-4 bg-white border border-gray-100 p-7 shadow-sm hover:shadow-md hover:border-forest-200 transition-all duration-500 ease-out ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <Stars rating={review.rating} />

              <p className="text-gray-500 text-sm leading-relaxed font-sans flex-1">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                {review.photo ? (
                  <img
                    src={review.photo}
                    alt={review.author}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-sans font-semibold text-sm flex-shrink-0">
                    {review.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-forest-900 text-sm font-sans font-semibold leading-tight truncate">
                    {review.author}
                  </p>
                  <p className="text-gray-400 text-[11px] font-sans mt-0.5">{review.time}</p>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <GoogleIcon />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
