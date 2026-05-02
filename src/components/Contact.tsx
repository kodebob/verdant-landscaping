"use client";

import { useInView } from "react-intersection-observer";
import { Phone, Mail, Clock } from "lucide-react";

const perks = [
  { icon: Phone, label: "Free site visit included" },
  { icon: Mail, label: "Response within 24 hours" },
  { icon: Clock, label: "No commitment required" },
];

export default function Contact() {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <section id="contact" className="relative py-36 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/images/primms-landscaping-llc-gallery-home-014-1920w.webp"
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-forest-950/85" />
      </div>

      {/* Decorative borders */}
      <div className="absolute top-8 left-8 w-32 h-32 border border-forest-700/30" aria-hidden="true" />
      <div className="absolute bottom-8 right-8 w-32 h-32 border border-forest-700/30" aria-hidden="true" />
      <div className="absolute top-8 right-8 w-48 h-48 border border-forest-800/20" aria-hidden="true" />
      <div className="absolute bottom-8 left-8 w-48 h-48 border border-forest-800/20" aria-hidden="true" />

      {/* Content */}
      <div
        ref={ref}
        className={`relative z-10 max-w-4xl mx-auto px-6 text-center transition-all duration-1000 ease-out ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
      >
        <p className="text-forest-400 text-[11px] tracking-[0.5em] uppercase mb-6 font-sans font-medium">
          Take the First Step
        </p>

        <h2
          className="font-display font-light text-white leading-tight mb-6"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
        >
          Your Dream Landscape<br />
          <em className="text-forest-300">Starts Here</em>
        </h2>

        <p className="text-white/55 text-base mb-14 max-w-2xl mx-auto font-sans leading-relaxed">
          Schedule a free, no-obligation consultation with our design team.
          We&apos;ll visit your property, listen to your vision, and show you exactly
          how we&apos;ll bring it to life — beautifully.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <a
            href="tel:+14124146323"
            className="group flex items-center justify-center gap-3 bg-forest-600 hover:bg-forest-500 text-white px-12 py-5 text-[11px] tracking-[0.25em] uppercase font-sans font-medium transition-all duration-300 hover:shadow-2xl hover:shadow-forest-950/60 hover:-translate-y-0.5"
          >
            <Phone className="w-4 h-4" />
            Call (412) 414-6323
          </a>
          <a
            href="mailto:hello@kmlandscaping.com"
            className="flex items-center justify-center gap-3 border border-white/35 hover:border-forest-400 hover:bg-forest-900/40 text-white px-12 py-5 text-[11px] tracking-[0.25em] uppercase font-sans font-medium transition-all duration-300"
          >
            <Mail className="w-4 h-4" />
            Email Us
          </a>
        </div>

        {/* Perks row */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          {perks.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-white/35 text-xs font-sans tracking-wider"
            >
              <Icon className="w-3.5 h-3.5 text-forest-600" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
