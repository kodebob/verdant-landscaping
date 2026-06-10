"use client";

import { useSearchParams } from "next/navigation";
import { ConfigProvider, type BusinessConfig } from "@/context/ConfigContext";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import ReviewTicker from "@/components/ReviewTicker";
import About from "@/components/About";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

interface Props {
  config: BusinessConfig;
  status: string;
  slug: string;
}

export default function PreviewClient({ config, status, slug }: Props) {
  const searchParams = useSearchParams();
  const justClaimed  = searchParams.get("claimed") === "true";

  const brandColors = Object.fromEntries(
    Object.entries(config.colors).map(([shade, value]) => [`--brand-${shade}`, value])
  ) as React.CSSProperties;

  const isSold = status === "sold" || justClaimed;

  return (
    <ConfigProvider config={config}>
      {/* Claim banner — only shown when not sold */}
      {!isSold && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0a0f1e] border-t border-white/10 px-6 py-4 flex items-center justify-between font-sans shadow-2xl">
          <div>
            <p className="text-white font-semibold text-sm">
              This is a free preview site built for <span className="text-[#d4a853]">{config.businessName}</span>
            </p>
            <p className="text-white/45 text-xs mt-0.5">
              Claim it for $100 — I&apos;ll customize it however you want. You only pay if you love it.
            </p>
          </div>
          <a
            href={`/api/checkout/${slug}`}
            className="flex-shrink-0 ml-6 bg-[#d4a853] hover:bg-[#c49742] text-black px-6 py-2.5 text-[11px] tracking-[0.25em] uppercase font-bold transition-colors"
          >
            Claim for $100
          </a>
        </div>
      )}

      {/* Claimed confirmation */}
      {isSold && justClaimed && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-emerald-900/90 border-t border-emerald-700/50 px-6 py-4 flex items-center justify-between font-sans">
          <p className="text-emerald-300 font-semibold text-sm">
            🎉 Payment received! Kody will have your site fully customized within 48 hours. Text him your photos and any changes.
          </p>
        </div>
      )}

      {/* Dev banner */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-sm border-b border-white/8 px-6 py-2 flex items-center justify-between font-sans text-xs">
        <span className="text-white/40">
          Preview — <span className="text-white/70">{config.businessName}</span>
        </span>
        <div className="flex items-center gap-4">
          <span className={`px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase font-semibold ${
            isSold ? "bg-emerald-900/50 text-emerald-400" : "bg-white/8 text-white/35"
          }`}>
            {isSold ? "sold" : status}
          </span>
          <a href="/dashboard" className="text-white/35 hover:text-white transition-colors">← Dashboard</a>
        </div>
      </div>

      {/* Site rendered with injected config colors */}
      <div style={brandColors} className={`pt-[37px] ${!isSold ? "pb-[80px]" : ""}`}>
        <Navbar />
        <main>
          <Hero />
          <TrustStrip />
          <About />
          <Services />
          <HowItWorks />
          <ReviewTicker />
          <Gallery />
          <Contact />
        </main>
        <Footer />
      </div>
    </ConfigProvider>
  );
}
