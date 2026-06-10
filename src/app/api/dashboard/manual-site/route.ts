import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { fillPhotos } from "@/lib/stockPhotos";

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60).replace(/^-|-$/g, "");
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
  const { name, phone, city, niche, description } = await req.json();
  if (!name?.trim() || !city?.trim() || !niche?.trim()) {
    return new Response(JSON.stringify({ error: "Name, city, and business type are required" }), { status: 400 });
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
      await send({ step: "config", message: "Generating site config..." });

      const photos = fillPhotos([], niche, 6);
      const photo0 = photos[0] ?? "";
      const photo1 = photos[1] ?? photo0;
      const photo2 = photos[2] ?? photo0;
      const photo3 = photos[3] ?? photo0;
      const photoJson = photos.map((u, i) => `{ "src": "${u}", "alt": "Photo ${i + 1}" }`).join(",\n    ");

      const prompt = `Generate a complete businessConfig JSON for a ${niche} business website.

BUSINESS INFO:
Name: ${name}
Phone: ${phone || "not provided"}
Location: ${city}
Business Type: ${niche}
${description ? `Additional info: ${description}` : ""}

IMPORTANT: Your entire response must be a single raw JSON object. Start your response with { and end with }. No markdown, no code fences, no explanation before or after.

{
  "businessName": "${name}",
  "legalName": "... LLC",
  "tagline": "Compelling one-line tagline",
  "niche": "${niche}",
  "phone": "${phone || ""}",
  "phoneHref": "tel:+1${(phone ?? "").replace(/\D/g, "")}",
  "email": "",
  "location": "${city}",
  "businessHours": ["Mon-Fri 8am-6pm", "Sat 9am-3pm"],
  "colors": { "50":"#...","100":"#...","200":"#...","300":"#...","400":"#...","500":"#...","600":"#...","700":"#...","800":"#...","900":"#...","950":"#..." },
  "metaTitle": "...", "metaDescription": "...", "metaKeywords": "...",
  "heroTagline": "Short hero eyebrow text",
  "heroPrimaryButton": { "text": "Get a Free Quote", "href": "#contact" },
  "heroSecondaryButton": { "text": "See Our Work", "href": "#gallery" },
  "heroVideos": [],
  "aboutSectionLabel": "Our Story",
  "aboutHeading": { "line1": "...", "line2": "..." },
  "aboutParagraphs": ["Para 1 (2-3 sentences)", "Para 2", "Para 3"],
  "aboutImage": "${photo0}", "aboutImageAlt": "...",
  "yearsExperience": "10+",
  "stats": [
    { "value": "5.0★", "label": "Average Rating" },
    { "value": "200+", "label": "Happy Customers" },
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
- Colors: unique palette for this niche — NO navy blue unless plumber. Landscaping→forest green, hardscape→warm slate, pressure washing→teal, painting→burgundy/terracotta, electrician→amber, roofing→dark brown, tree service→olive. Full 11-shade scale, 950 = very dark background.
- Services: write 3 real services for a ${niche} business
- Service icons only from: pencil, layoutgrid, treepine, snowflake, wrench, droplets, sun, leaf
- processSteps icons only: messagecircle, filetext, shovel, refreshcw, checkcheck
- Write compelling, specific copy — not generic filler`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: "You are a JSON generator. Every response must be a single valid JSON object — start with { and end with }. No markdown, no code fences, no explanation.",
        messages: [{ role: "user", content: prompt }],
      });

      const rawText = response.content[0].type === "text" ? response.content[0].text : "";
      const config = parseJson(rawText);

      if (!config) {
        await send({ step: "error", message: "Failed to generate config. Please try again." });
        return;
      }

      config.reviews = [];

      await send({ step: "saving", message: "Saving to database..." });

      let slug = generateSlug(name);
      const { data: existing } = await supabase.from("sites").select("slug").eq("slug", slug).maybeSingle();
      if (existing) slug = `${slug}-${Date.now().toString(36)}`;

      const { error: dbError } = await supabase.from("sites").insert({
        slug,
        business_name: name,
        config,
        photos,
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
          businessName: name,
          slug,
          previewUrl: `https://preview.mallardcreative.net/preview/${slug}`,
          photosCount: 0,
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
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
