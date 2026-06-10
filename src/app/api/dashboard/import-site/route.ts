import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { fillPhotos } from "@/lib/stockPhotos";

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60).replace(/^-|-$/g, "");
}

function extractImages(html: string, baseUrl: string): string[] {
  try {
    const origin = new URL(baseUrl).origin;
    const urls: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[1];
      if (src.startsWith("data:") || src.startsWith("#")) continue;
      if (src.startsWith("//")) src = "https:" + src;
      else if (src.startsWith("/")) src = origin + src;
      if (!src.startsWith("http")) continue;
      if (/icon|logo|favicon|sprite|pixel|tracking|analytics|badge|arrow|btn|button/i.test(src)) continue;
      if (/\.(svg|gif|ico)(\?|$)/i.test(src)) continue;
      urls.push(src);
    }
    return [...new Set(urls)].slice(0, 8);
  } catch {
    return [];
  }
}

function parseJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url?.trim()) {
    return new Response(JSON.stringify({ error: "URL is required" }), { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  const send = async (data: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  (async () => {
    try {
      await send({ step: "fetching", message: "Fetching website..." });

      const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
      let html = "";
      try {
        const res = await fetch(normalizedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) {
          await send({ step: "error", message: `Site returned ${res.status}. Make sure the URL is correct and publicly accessible.` });
          return;
        }
        html = await res.text();
      } catch (err) {
        await send({ step: "error", message: `Could not reach website: ${err instanceof Error ? err.message : "Network error"}` });
        return;
      }

      const imageUrls = extractImages(html, normalizedUrl);

      const pageText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);

      await send({ step: "fetching_done", message: `Fetched — ${imageUrls.length} image${imageUrls.length !== 1 ? "s" : ""} found` });

      await send({ step: "config", message: "Generating site config..." });

      const photo0 = imageUrls[0] ?? "";
      const photo1 = imageUrls[1] ?? photo0;
      const photo2 = imageUrls[2] ?? photo0;
      const photo3 = imageUrls[3] ?? photo0;
      const photoJson = imageUrls.length > 0
        ? imageUrls.map((u, i) => `{ "src": "${u}", "alt": "Photo ${i + 1}" }`).join(",\n    ")
        : `{ "src": "", "alt": "Photo 1" }`;

      const prompt = `You are a web developer. An existing business website has been scraped. Extract the business info and generate a new modern website config.

ORIGINAL WEBSITE: ${normalizedUrl}

PAGE TEXT (extracted from HTML):
${pageText}

IMPORTANT: Your entire response must be a single raw JSON object. Start your response with { and end with }. No markdown, no code fences, no explanation before or after. Extract REAL info from the page:

{
  "businessName": "...",
  "legalName": "... LLC",
  "tagline": "Compelling one-line tagline based on their actual business",
  "niche": "one word describing trade",
  "phone": "...",
  "phoneHref": "tel:+1...",
  "email": "",
  "location": "City, State",
  "businessHours": ["Mon-Fri Xam-Xpm"],
  "colors": { "50":"#...","100":"#...","200":"#...","300":"#...","400":"#...","500":"#...","600":"#...","700":"#...","800":"#...","900":"#...","950":"#..." },
  "metaTitle": "...", "metaDescription": "...", "metaKeywords": "...",
  "heroTagline": "Short hero eyebrow text",
  "heroPrimaryButton": { "text": "Get a Free Quote", "href": "#contact" },
  "heroSecondaryButton": { "text": "See Our Work", "href": "#gallery" },
  "heroVideos": [],
  "aboutSectionLabel": "Our Story",
  "aboutHeading": { "line1": "...", "line2": "..." },
  "aboutParagraphs": ["Para 1 (2-3 sentences specific to this business)", "Para 2", "Para 3"],
  "aboutImage": "${photo0}",
  "aboutImageAlt": "...",
  "yearsExperience": "10+",
  "stats": [
    { "value": "5.0★", "label": "Average Rating" },
    { "value": "100+", "label": "Happy Customers" },
    { "value": "10+", "label": "Years of Experience" }
  ],
  "services": [
    { "icon": "wrench", "title": "Service 1", "description": "...", "image": "${photo1}" },
    { "icon": "layoutgrid", "title": "Service 2", "description": "...", "image": "${photo2}" },
    { "icon": "sun", "title": "Service 3", "description": "...", "image": "${photo3}" }
  ],
  "processSteps": [
    { "icon": "messagecircle", "number": "01", "title": "Free Consultation", "description": "..." },
    { "icon": "filetext", "number": "02", "title": "Custom Quote", "description": "..." },
    { "icon": "shovel", "number": "03", "title": "Expert Work", "description": "..." },
    { "icon": "checkcheck", "number": "04", "title": "Your Satisfaction", "description": "..." }
  ],
  "galleryImages": [ ${photoJson} ],
  "contactImage": "${photo0}",
  "contactSectionLabel": "Get In Touch",
  "contactHeading": { "line1": "Ready to Get Started?", "line2": "Contact Us Today" },
  "contactSubheading": "...",
  "footerDescription": "...",
  "footerTagline": "...",
  "footerServices": ["Service 1","Service 2","Service 3","Service 4","Service 5"],
  "reviews": []
}

RULES:
- Extract REAL business name, phone number, city/state from the page text
- Colors: unique brand palette for the business type — NO navy blue (unless it's a plumber). Landscaping→forest green, hardscape→warm slate, pressure washing→teal, painting→burgundy/terracotta, electrician→amber, roofing→dark brown, tree service→olive. Generate full 11-shade scale, 950 = very dark background.
- Services: extract what they ACTUALLY offer from the page — use their real service names
- Service icons only from: pencil, layoutgrid, treepine, snowflake, wrench, droplets, sun, leaf
- processSteps icons only: messagecircle, filetext, shovel, refreshcw, checkcheck
- If the page mentions real stats (years in business, # customers, etc), use those`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });

      const rawText = response.content[0].type === "text" ? response.content[0].text : "";
      const config = parseJson(rawText);

      if (!config) {
        await send({ step: "error", message: "Failed to parse Claude's response. Please try again." });
        return;
      }

      // Fall back to stock photos if no images were extractable
      if (imageUrls.length === 0) {
        const niche = (config.niche as string) ?? "default";
        const stock = fillPhotos([], niche, 6);
        config.aboutImage = stock[0] ?? "";
        config.contactImage = stock[0] ?? "";
        config.galleryImages = stock.map((src, i) => ({ src, alt: `Photo ${i + 1}` }));
        if (Array.isArray(config.services)) {
          (config.services as Array<{ image?: string }>).forEach((s, i) => { s.image = stock[i + 1] ?? stock[0] ?? ""; });
        }
      }

      config.reviews = [];

      await send({ step: "saving", message: "Saving to database..." });

      const businessName = (config.businessName as string) ?? "Imported Business";
      let slug = generateSlug(businessName);
      const { data: existing } = await supabase.from("sites").select("slug").eq("slug", slug).maybeSingle();
      if (existing) slug = `${slug}-${Date.now().toString(36)}`;

      const { error: dbError } = await supabase.from("sites").insert({
        slug,
        business_name: businessName,
        config,
        photos: imageUrls,
        status: "preview",
      });

      if (dbError) {
        await send({ step: "error", message: `Database error: ${dbError.message}` });
        return;
      }

      await send({
        step: "done",
        message: "Done",
        result: {
          businessName,
          slug,
          previewUrl: `https://preview.mallardcreative.net/preview/${slug}`,
          photosCount: imageUrls.length,
          config,
        },
      });
    } catch (err) {
      await send({ step: "error", message: err instanceof Error ? err.message : "Unknown error occurred" });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
