"use client";

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
  const brandColors = Object.fromEntries(
    Object.entries(config.colors).map(([shade, value]) => [`--brand-${shade}`, value])
  ) as React.CSSProperties;

  return (
    <ConfigProvider config={config}>
      {/* Banner */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-sm border-b border-white/10 px-6 py-2.5 flex items-center justify-between font-sans text-xs">
        <span className="text-white/50">
          Preview — <span className="text-white">{config.businessName}</span>
        </span>
        <div className="flex items-center gap-4">
          <span className={`px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase font-semibold ${status === "sold" ? "bg-emerald-900/50 text-emerald-400" : "bg-white/10 text-white/40"}`}>
            {status}
          </span>
          <a href="/dashboard" className="text-white/40 hover:text-white transition-colors">← Dashboard</a>
        </div>
      </div>

      {/* Site rendered with injected config colors */}
      <div style={brandColors} className="pt-[41px]">
        <Navbar />
        <main>
          <Hero />
          <TrustStrip />
          <ReviewTicker />
          <About />
          <Services />
          <HowItWorks />
          <Gallery />
          <Contact />
        </main>
        <Footer />
      </div>
    </ConfigProvider>
  );
}
