"use client";

import { useInView } from "react-intersection-observer";
import { MessageCircle, FileText, Shovel, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Free Consultation",
    description:
      "We visit your property to understand your vision, assess your space, and discuss your goals and budget. No obligation, no pressure — just a conversation.",
    icon: MessageCircle,
  },
  {
    number: "02",
    title: "Design Proposal",
    description:
      "Our designers craft a detailed plan including plant selections, hardscape layouts, materials, and a phased implementation timeline built around your needs.",
    icon: FileText,
  },
  {
    number: "03",
    title: "Expert Installation",
    description:
      "Our skilled crews bring your design to life with precision and pride. We keep your property clean and respect your time throughout the entire process.",
    icon: Shovel,
  },
  {
    number: "04",
    title: "Ongoing Care",
    description:
      "We offer comprehensive seasonal maintenance programs to keep your landscape thriving through every season — protecting your investment year after year.",
    icon: RefreshCw,
  },
];

export default function HowItWorks() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section id="process" ref={ref} className="py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-forest-600 text-[11px] tracking-[0.4em] uppercase mb-5 font-sans font-medium">
            Our Approach
          </p>
          <h2
            className="font-display font-light text-forest-900"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
          >
            How It Works
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line — desktop only */}
          <div
            className="absolute top-[52px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-forest-200 to-transparent hidden md:block"
            aria-hidden="true"
          />

          <div className="grid md:grid-cols-4 gap-10 md:gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center text-center transition-all duration-700 ease-out ${
                    inView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  {/* Step circle */}
                  <div className="relative mb-10">
                    <div className="w-[104px] h-[104px] bg-forest-50 border border-forest-200 flex flex-col items-center justify-center gap-1 relative z-10">
                      <Icon className="w-6 h-6 text-forest-700" />
                      <span className="text-forest-400 text-[10px] tracking-[0.2em] font-sans font-semibold">
                        {step.number}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display text-2xl font-semibold text-forest-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-sans max-w-[220px]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA nudge */}
        <div
          className={`text-center mt-20 transition-all duration-700 delay-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <a
            href="#contact"
            className="inline-block bg-forest-800 hover:bg-forest-700 text-white px-10 py-4 text-[11px] tracking-[0.25em] uppercase font-sans font-medium transition-all duration-300 hover:shadow-xl hover:shadow-forest-900/20 hover:-translate-y-px"
          >
            Start Your Journey
          </a>
        </div>
      </div>
    </section>
  );
}
