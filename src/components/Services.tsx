"use client";

import { useInView } from "react-intersection-observer";
import {
  Pencil, LayoutGrid, TreePine, Snowflake,
  Wrench, Droplets, Sun, Leaf,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useBusinessConfig } from "@/config/useBusinessConfig";

const iconMap: Record<string, LucideIcon> = {
  pencil:     Pencil,
  layoutgrid: LayoutGrid,
  treepine:   TreePine,
  snowflake:  Snowflake,
  wrench:     Wrench,
  droplets:   Droplets,
  sun:        Sun,
  leaf:       Leaf,
};

export default function Services() {
  const config = useBusinessConfig();
  const { ref, inView } = useInView({ threshold: 0.05, triggerOnce: true });

  return (
    <section id="services" ref={ref} className="py-28 bg-forest-50">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <p className="text-forest-600 text-[11px] tracking-[0.4em] uppercase mb-5 font-sans font-medium">
            What We Do
          </p>
          <h2
            className="font-display font-light text-forest-900"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
          >
            Our Services
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.services.map((svc, i) => {
            const Icon = iconMap[svc.icon] ?? Leaf;
            return (
              <div
                key={svc.title}
                className={`group bg-white border border-transparent hover:border-forest-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-forest-900/10 hover:-translate-y-2 cursor-default overflow-hidden ${
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{
                  transitionDelay: `${i * 80}ms`,
                  transitionProperty: "opacity, transform, box-shadow, border-color",
                }}
              >
                <div className="relative h-48 overflow-hidden bg-forest-100 flex items-center justify-center">
                  {svc.image ? (
                    <img
                      src={svc.image}
                      alt={svc.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center">
                      <Icon className="w-12 h-12 text-forest-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-forest-900/0 group-hover:bg-forest-900/30 transition-all duration-500" />
                  <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 group-hover:bg-forest-800 flex items-center justify-center transition-colors duration-400 shadow-md">
                    <Icon className="w-4 h-4 text-forest-700 group-hover:text-forest-200 transition-colors duration-400" />
                  </div>
                </div>

                <div className="p-7">
                  <h3 className="font-display text-xl font-semibold text-forest-900 mb-3 group-hover:text-forest-700 transition-colors">
                    {svc.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm font-sans">
                    {svc.description}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-forest-600 text-[11px] tracking-[0.2em] uppercase font-sans font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Learn More</span>
                    <span className="text-base leading-none translate-y-px">→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
