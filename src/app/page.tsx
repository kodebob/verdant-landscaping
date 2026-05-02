import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Visualizer from "@/components/Visualizer";
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
        <About />
        <Services />
        <Visualizer />
        <HowItWorks />
        <Gallery />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
