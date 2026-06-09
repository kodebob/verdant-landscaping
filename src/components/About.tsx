"use client";

import { useInView } from "react-intersection-observer";
import { useBusinessConfig } from "@/config/useBusinessConfig";

export default function About() {
  const config = useBusinessConfig();
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: true });

  return (
    <section id="about" ref={ref} className="py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 lg:gap-24 items-center">

        {/* Image block */}
        <div
          className={`relative transition-all duration-1000 ease-out ${
            inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-16"
          }`}
        >
          <div className="relative aspect-[3/4] overflow-hidden">
            <img
              src={config.aboutImage}
              alt={config.aboutImageAlt}
              className="w-full h-full object-cover"
            />
          </div>

          <div
            className="absolute -bottom-5 -right-5 w-full h-full border-2 border-forest-400/60 -z-10"
            aria-hidden="true"
          />

          <div className="absolute -top-6 -left-6 bg-forest-800 text-white p-6 shadow-2xl">
            <div className="font-display text-4xl font-light leading-none">{config.yearsExperience}</div>
            <div className="text-forest-300 text-[10px] tracking-[0.2em] uppercase mt-1 font-sans leading-snug">
              Years Combined<br />Experience
            </div>
          </div>
        </div>

        {/* Text block */}
        <div
          className={`transition-all duration-1000 delay-200 ease-out ${
            inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-16"
          }`}
        >
          <p className="text-forest-600 text-[11px] tracking-[0.4em] uppercase mb-5 font-sans font-medium">
            {config.aboutSectionLabel}
          </p>

          <h2 className="font-display font-light text-forest-900 leading-tight mb-7"
            style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
            {config.aboutHeading.line1}<br />
            <em>{config.aboutHeading.line2}</em>
          </h2>

          {config.aboutParagraphs.map((paragraph, i) => (
            <p
              key={i}
              className={`text-gray-500 leading-relaxed font-sans text-[15px] ${
                i < config.aboutParagraphs.length - 1 ? "mb-5" : "mb-12"
              }`}
            >
              {paragraph}
            </p>
          ))}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 border-t border-forest-100 pt-10">
            {config.stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-4xl font-light text-forest-800 leading-none">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-[10px] tracking-[0.2em] uppercase mt-2 font-sans leading-snug">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
