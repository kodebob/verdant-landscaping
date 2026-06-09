export const businessConfig = {
  // ── Identity ──────────────────────────────────────────────────────────────
  businessName: "Steel City Hardscape",
  legalName: "Steel City Hardscape LLC",
  tagline: "Pittsburgh's Premier Hardscape Company",
  niche: "hardscape",

  // ── Contact ───────────────────────────────────────────────────────────────
  phone: "412-867-5309",
  phoneHref: "tel:+14128675309",
  email: "info@steelcityhardscape.com",
  location: "Pittsburgh, PA",
  businessHours: ["Mon–Fri 8am–5pm", "Sat 9am–2pm"],

  // ── Brand colors ──────────────────────────────────────────────────────────
  // Full 11-shade navy palette derived from primaryColor #1a3a5c.
  // Change these values to fully rebrand the site's color palette.
  colors: {
    50:  "#f0f5fa",
    100: "#d8e6f3",
    200: "#adc8e6",
    300: "#7ca8d4",
    400: "#4d89c2",
    500: "#2b6aab",
    600: "#1e5290",
    700: "#1a3a5c",
    800: "#122840",
    900: "#0a1929",
    950: "#060f1a",
  },

  // ── SEO / Meta ────────────────────────────────────────────────────────────
  metaTitle: "Steel City Hardscape | Pittsburgh's Premier Hardscape Company",
  metaDescription:
    "Transform your outdoor space with Pittsburgh's premier hardscape contractor. Steel City Hardscape specializes in patio installation, retaining walls, outdoor kitchens, and custom stonework.",
  metaKeywords: "hardscape, patio installation, retaining walls, outdoor kitchen, Pittsburgh hardscape contractor",

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroTagline: "Premium Hardscape Design & Installation",
  heroPrimaryButton:   { text: "Get a Free Quote", href: "#contact" },
  heroSecondaryButton: { text: "See Our Work",     href: "#gallery" },
  heroVideos: [
    "https://trbxniwzpsf1hxso.public.blob.vercel-storage.com/4544137-hd_1920_1080_30fps.mp4",
    "https://trbxniwzpsf1hxso.public.blob.vercel-storage.com/17045602-hd_1920_1080_50fps.mp4",
    "https://trbxniwzpsf1hxso.public.blob.vercel-storage.com/15473106_1080_1920_30fps.mp4",
    "https://trbxniwzpsf1hxso.public.blob.vercel-storage.com/15634486_3840_2160_60fps.mp4",
    "https://trbxniwzpsf1hxso.public.blob.vercel-storage.com/9477579-uhd_3840_2160_24fps.mp4",
  ],

  // ── About ─────────────────────────────────────────────────────────────────
  aboutSectionLabel: "Our Story",
  aboutHeading: {
    line1: "Built for Pittsburgh,",
    line2: "Built to Last",
  },
  aboutParagraphs: [
    "Steel City Hardscape was founded on a simple belief: your outdoor space should be as tough and beautiful as the city it's in. We're a Pittsburgh crew — born here, trained here, and proud to transform backyards across the region one project at a time.",
    "Every patio, retaining wall, and outdoor kitchen we build starts with the same commitment: use the right materials, do the work right, and stand behind it. No shortcuts. No subcontractors you've never met. Just our team, on your property, treating it like our own.",
    "We specialize in hardscape because it's what we're best at. Stone, concrete, and steel — permanent structures that add lasting value and give you a backyard worth living in. That's what Steel City Hardscape is about.",
  ],
  aboutImage:    "/images/tmpcom88ubb.webp",
  aboutImageAlt: "Custom patio and retaining wall installation by Steel City Hardscape",
  yearsExperience: "15+",
  stats: [
    { value: "15+",  label: "Years in Pittsburgh" },
    { value: "800+", label: "Projects Completed" },
    { value: "4.9★", label: "Average Rating" },
  ],

  // ── Services ──────────────────────────────────────────────────────────────
  // icon: one of "pencil" | "layoutgrid" | "treepine" | "snowflake" |
  //              "wrench" | "droplets" | "sun" | "leaf"
  services: [
    {
      icon: "layoutgrid",
      title: "Patio Installation",
      description:
        "Custom paver and natural stone patios designed to fit your space and lifestyle — built with materials that hold up to Pittsburgh winters for decades.",
      image: "/services/hardscaping.jpg",
    },
    {
      icon: "wrench",
      title: "Retaining Walls",
      description:
        "Structural and decorative retaining walls that solve drainage problems, prevent erosion, and turn sloped lots into usable outdoor living space.",
      image: "/services/landscape-design.jpg",
    },
    {
      icon: "sun",
      title: "Outdoor Kitchens",
      description:
        "Fully custom outdoor kitchen builds — grill stations, countertops, storage, and fire features — designed for the way you actually cook and entertain.",
      image: "/services/hardscaping.jpg",
    },
  ],

  // ── Process / How It Works ────────────────────────────────────────────────
  // icon: one of "messagecircle" | "filetext" | "shovel" | "refreshcw" |
  //              "clipboard" | "camera" | "checkcheck"
  processSteps: [
    {
      icon: "messagecircle",
      number: "01",
      title: "Free Consultation",
      description:
        "We walk your property, listen to what you want, and take measurements. You'll know exactly what's possible before we talk numbers.",
    },
    {
      icon: "filetext",
      number: "02",
      title: "Design & Quote",
      description:
        "We provide a detailed design plan and itemized quote. No vague estimates — you'll know exactly what you're getting and what it costs.",
    },
    {
      icon: "shovel",
      number: "03",
      title: "Expert Installation",
      description:
        "Our crew handles everything from excavation to final seal coat. We keep your property clean and finish on schedule.",
    },
    {
      icon: "checkcheck",
      number: "04",
      title: "Final Walkthrough",
      description:
        "We don't consider the job done until you do. We walk the finished project with you and handle anything that isn't exactly right.",
    },
  ],

  // ── Gallery ───────────────────────────────────────────────────────────────
  galleryImages: [
    { src: "/images/tmpcom88ubb.webp",                                          alt: "Custom paver patio with built-in seating wall" },
    { src: "/images/primms-landscaping-llc-gallery-home-014-1920w.webp",        alt: "Natural stone retaining wall with steps" },
    { src: "/images/tmpcauhvsjm.webp",                                          alt: "Outdoor kitchen with grill station and bar" },
    { src: "/images/primms-landscaping-llc-gallery-home-016-1920w.webp",        alt: "Flagstone patio with fire pit" },
    { src: "/images/e0cabf_033422d1ab3a430ab3de8bd790435dac~mv2.avif",          alt: "Concrete paver driveway and walkway" },
    { src: "/images/e0cabf_42b832a1201443d8891508d374523d44~mv2.avif",          alt: "Tiered retaining wall system" },
    { src: "/images/e0cabf_54764b87c3ca40648b29e222326fef29~mv2.avif",          alt: "Bluestone patio with pergola foundation" },
    { src: "/images/e0cabf_6e2b05db654241579e776d6e10094017~mv2.avif",          alt: "Backyard patio and outdoor living space" },
    { src: "/images/e0cabf_803c8f34c0124dcf911d3ea4f33be784~mv2.avif",          alt: "Brick walkway and front entry hardscape" },
    { src: "/images/e0cabf_b8b92f6e315b4b52b1079282e3223847~mv2.avif",          alt: "Stone steps and landing installation" },
    { src: "/images/e0cabf_ccaae962cfe24712968bba44407340fb~mv2.avif",          alt: "Pool deck and surrounding hardscape" },
  ],

  // ── Location ──────────────────────────────────────────────────────────────
  location: "Pittsburgh, PA",

  // ── Reviews ───────────────────────────────────────────────────────────────
  reviews: [] as { author: string; rating: number; text: string; time: string; photo?: string }[],

  // ── Contact section ───────────────────────────────────────────────────────
  contactImage:        "/images/primms-landscaping-llc-gallery-home-014-1920w.webp",
  contactSectionLabel: "Ready to Build?",
  contactHeading: {
    line1: "Your Dream Outdoor Space",
    line2: "Starts Here",
  },
  contactSubheading:
    "Get a free, no-obligation quote from Pittsburgh's hardscape specialists. We'll visit your property, assess the site, and give you an honest plan and price — no pressure, no runaround.",

  // ── Footer ────────────────────────────────────────────────────────────────
  footerDescription:
    "Pittsburgh's premier hardscape contractor. We build patios, retaining walls, outdoor kitchens, and custom stonework that lasts a lifetime.",
  footerTagline: "Built to last a lifetime.",
  footerServices: [
    "Patio Installation",
    "Retaining Walls",
    "Outdoor Kitchens",
    "Walkways & Steps",
    "Fire Pits & Fireplaces",
    "Drainage Solutions",
  ],
};
