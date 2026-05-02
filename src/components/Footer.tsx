const services = [
  "Landscape Design",
  "Lawn Care",
  "Hardscaping",
  "Trees & Shrubs",
  "Seasonal Cleanup",
  "Irrigation",
];

const company = [
  { label: "About Us", href: "#about" },
  { label: "Our Process", href: "#process" },
  { label: "AI Visualizer", href: "#visualizer" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-forest-950 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">

        {/* Top grid */}
        <div className="grid md:grid-cols-12 gap-12 mb-16 pb-16 border-b border-white/8">
          {/* Brand */}
          <div className="md:col-span-5">
            <a
              href="#hero"
              className="font-sans font-extrabold text-white uppercase tracking-tight text-3xl hover:text-forest-300 transition-colors inline-block mb-5"
            >
              K&amp;M Landscaping
            </a>
            <p className="text-white/35 text-sm leading-relaxed max-w-xs font-sans mb-8">
              Premium landscape design and outdoor living solutions for
              homeowners who believe beauty matters.
            </p>
            <p className="font-display italic text-forest-500 text-lg font-light">
              &ldquo;Where nature meets artistry.&rdquo;
            </p>
          </div>

          {/* Services */}
          <div className="md:col-span-3">
            <h4 className="text-white text-[10px] tracking-[0.35em] uppercase mb-6 font-sans font-semibold">
              Services
            </h4>
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item}>
                  <a
                    href="#services"
                    className="text-white/35 hover:text-forest-400 text-sm transition-colors font-sans"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="md:col-span-2">
            <h4 className="text-white text-[10px] tracking-[0.35em] uppercase mb-6 font-sans font-semibold">
              Company
            </h4>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-white/35 hover:text-forest-400 text-sm transition-colors font-sans"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div className="md:col-span-2">
            <h4 className="text-white text-[10px] tracking-[0.35em] uppercase mb-6 font-sans font-semibold">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+14124146323"
                  className="text-white/35 hover:text-forest-400 text-sm transition-colors font-sans"
                >
                  (412) 414-6323
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@kmlandscaping.com"
                  className="text-white/35 hover:text-forest-400 text-sm transition-colors font-sans"
                >
                  hello@kmlandscaping.com
                </a>
              </li>
              <li className="text-white/25 text-sm font-sans">
                Mon–Fri 8am–6pm<br />Sat 9am–3pm
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs font-sans">
            © {year} K and M Landscaping LLC. All rights reserved.
          </p>
          <div className="flex gap-8">
            {["Privacy Policy", "Terms of Service", "Sitemap"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-white/20 hover:text-white/50 text-xs transition-colors font-sans"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
