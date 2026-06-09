"use client";

import { Star, ShieldCheck, MapPin } from "lucide-react";
import { useBusinessConfig } from "@/config/useBusinessConfig";

export default function TrustStrip() {
  const config = useBusinessConfig();

  const ratingValue = config.stats.find(
    (s) => s.label.toLowerCase().includes("rating")
  )?.value ?? "5.0★";

  const reviewCount = config.stats.find(
    (s) => s.label.toLowerCase().includes("customer")
  )?.value;

  return (
    <div className="bg-forest-950 border-b border-white/5 py-3.5">
      <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">

        <div className="flex items-center gap-2 text-white/40 text-[11px] tracking-[0.2em] uppercase font-sans">
          <MapPin className="w-3.5 h-3.5 text-forest-500 flex-shrink-0" />
          <span>Serving <span className="text-forest-400">{config.location}</span> &amp; Surrounding Areas</span>
        </div>

        <div className="w-px h-3.5 bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-white/40 text-[11px] tracking-[0.15em] font-sans">
            {ratingValue} on Google{reviewCount ? ` · ${reviewCount} reviews` : ""}
          </span>
        </div>

        <div className="w-px h-3.5 bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-1.5 text-white/35 text-[11px] tracking-[0.2em] uppercase font-sans">
          <ShieldCheck className="w-3.5 h-3.5 text-forest-500 flex-shrink-0" />
          <span>Licensed &amp; Insured</span>
        </div>

      </div>
    </div>
  );
}
