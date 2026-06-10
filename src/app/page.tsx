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

export default function Home() {
  return (
    <>
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
    </>
  );
}
