"use client";

import { useInView } from "react-intersection-observer";
import { Pencil, Leaf, LayoutGrid, TreePine, Snowflake, Droplets } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
  image: string;
}

const services: Service[] = [
  {
    icon: Pencil,
    title: "Landscape Design",
    description:
      "Custom designs tailored to your space, lifestyle, and budget — crafted by certified landscape architects with decades of experience.",
    image: "/services/landscape-design.jpg",
  },
  {
    icon: Leaf,
    title: "Lawn Care",
    description:
      "Year-round maintenance programs keeping your turf lush, green, and weed-free through every season with precision and care.",
    image: "/services/lawn-care.webp",
  },
  {
    icon: LayoutGrid,
    title: "Hardscaping",
    description:
      "Premium patios, walkways, retaining walls, and outdoor structures built with the finest materials to last a lifetime.",
    image: "/services/hardscaping.jpg",
  },
  {
    icon: TreePine,
    title: "Trees & Shrubs",
    description:
      "Expert selection, planting, pruning, and care for trees and ornamental shrubs that define the character of your landscape.",
    image: "/services/trees-shrubs.jpg",
  },
  {
    icon: Snowflake,
    title: "Seasonal Cleanup",
    description:
      "Spring and fall cleanup services that keep your property pristine and perfectly prepared for every change in season.",
    image: "/services/seasonal-cleanup.avif",
  },
  {
    icon: Droplets,
    title: "Irrigation",
    description:
      "Smart irrigation systems engineered for maximum efficiency — healthier plants, reduced water waste, and lower bills.",
    image: "/services/irrigation.jpg",
  },
];

export default function Services() {
  const { ref, inView } = useInView({ threshold: 0.05, triggerOnce: true });

  return (
    <section id="services" ref={ref} className="py-28 bg-forest-50">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
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

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc, i) => {
            const Icon = svc.icon;
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
                {/* Service image */}
                <div className="relative h-48 overflow-hidden bg-forest-100 flex items-center justify-center">
                  {svc.image ? (
                    <img
                      src={svc.image}
                      alt={svc.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    /* Placeholder when no image uploaded yet */
                    <div className="w-full h-full bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center">
                      <Icon className="w-12 h-12 text-forest-400" />
                    </div>
                  )}
                  {/* Green tint on hover */}
                  <div className="absolute inset-0 bg-forest-900/0 group-hover:bg-forest-900/30 transition-all duration-500" />
                  {/* Icon badge */}
                  <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 group-hover:bg-forest-800 flex items-center justify-center transition-colors duration-400 shadow-md">
                    <Icon className="w-4 h-4 text-forest-700 group-hover:text-forest-200 transition-colors duration-400" />
                  </div>
                </div>

                {/* Card body */}
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
