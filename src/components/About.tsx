"use client";

import { useInView } from "react-intersection-observer";

const stats = [
  { value: "20+", label: "Years Combined Experience" },
  { value: "500+", label: "Properties Completed" },
  { value: "4.9★", label: "Average Rating" },
];

export default function About() {
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
              src="/images/tmpcom88ubb.webp"
              alt="Luxury home with professionally designed landscape and curved driveway"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Decorative frame */}
          <div
            className="absolute -bottom-5 -right-5 w-full h-full border-2 border-forest-400/60 -z-10"
            aria-hidden="true"
          />

          {/* Floating badge */}
          <div className="absolute -top-6 -left-6 bg-forest-800 text-white p-6 shadow-2xl">
            <div className="font-display text-4xl font-light leading-none">20+</div>
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
            Our Story
          </p>

          <h2 className="font-display font-light text-forest-900 leading-tight mb-7"
            style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
            Built on Friendship,<br />
            <em>Grown on Hard Work</em>
          </h2>

          <p className="text-gray-500 leading-relaxed mb-5 font-sans text-[15px]">
            K and M Landscaping started the way the best things do — with two kids in first grade
            who just clicked. We grew up together, and for as long as either of us can remember,
            we talked about building something of our own someday. It wasn&apos;t just a dream —
            it was a plan.
          </p>

          <p className="text-gray-500 leading-relaxed mb-5 font-sans text-[15px]">
            What made it natural was that we both found our way into landscaping from a young age,
            independently of each other. We learned the trade the right way — hands in the dirt,
            working real properties, earning the trust of real clients. Over the years, that hands-on
            experience added up to something worth building on.
          </p>

          <p className="text-gray-500 leading-relaxed mb-12 font-sans text-[15px]">
            When the time came to finally make that childhood plan a reality, it was an easy
            call. We combined everything we&apos;d learned, put our names behind it, and got to work.
            K and M Landscaping is the result — a company rooted in friendship, driven by
            craftsmanship, and committed to treating every yard like it&apos;s our own.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 border-t border-forest-100 pt-10">
            {stats.map((stat) => (
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
