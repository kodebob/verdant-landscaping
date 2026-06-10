import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

async function resolvePhotoUrl(ref: string, key: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${ref}&key=${key}`,
      { redirect: "follow" }
    );
    // After redirect, the final URL is a public Google CDN URL with no key
    return res.url.startsWith("https://lh3.googleusercontent.com") ? res.url : null;
  } catch {
    return null;
  }
}

function extractSearchQuery(input: string): string {
  const mapsMatch = input.match(/maps\/place\/([^/@?]+)/);
  if (mapsMatch) return decodeURIComponent(mapsMatch[1]).replace(/\+/g, " ");
  return input.trim();
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: "Query is required" }), { status: 400 });
  }

  const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY!;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  const send = async (data: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  (async () => {
    try {
      // ── Step 1: Find business ──────────────────────────────────────────────
      await send({ step: "finding", message: "Finding business..." });

      const searchQuery = extractSearchQuery(query);
      const searchRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_KEY}`
      );
      const searchData = await searchRes.json();

      if (searchData.status !== "OK" || !searchData.results?.length) {
        await send({ step: "error", message: `Business not found (${searchData.status}). Try a more specific name and city.` });
        return;
      }

      const placeId = searchData.results[0].place_id;

      // ── Step 2: Get place details ──────────────────────────────────────────
      const detailsRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,opening_hours,photos,editorial_summary,types,user_ratings_total,reviews&key=${GOOGLE_KEY}`
      );
      const detailsData = await detailsRes.json();
      const d = detailsData.result;

      await send({ step: "found", message: `Found: ${d.name}`, businessName: d.name });

      // ── Step 3: Download photos ────────────────────────────────────────────
      await send({ step: "photos", message: "Pulling photos..." });

      const refs: string[] = (d.photos ?? []).slice(0, 6).map((p: { photo_reference: string }) => p.photo_reference);
      const photoUrls: string[] = [];

      for (const ref of refs) {
        const url = await resolvePhotoUrl(ref, GOOGLE_KEY);
        if (url) photoUrls.push(url);
      }

      await send({ step: "photos_done", message: `Pulled ${photoUrls.length} photo${photoUrls.length !== 1 ? "s" : ""}`, count: photoUrls.length });

      // ── Step 4: Generate config with Claude ───────────────────────────────
      await send({ step: "config", message: "Generating config..." });

      const hours = (d.opening_hours?.weekday_text ?? []).join(" | ");
      const description = d.editorial_summary?.overview ?? "";
      const types = (d.types ?? [])
        .filter((t: string) => !["point_of_interest", "establishment"].includes(t))
        .join(", ");

      const photoJson = photoUrls.map((url, i) => `{ "src": "${url}", "alt": "Photo ${i + 1}" }`).join(",\n    ");
      const photo0 = photoUrls[0] ?? "";
      const photo1 = photoUrls[1] ?? photo0;
      const photo2 = photoUrls[2] ?? photo0;
      const photo3 = photoUrls[3] ?? photo0;

      const prompt = `You are a web developer. A client's business was scraped from Google Places. Generate a complete businessConfig JSON object for their website.

BUSINESS DATA:
Name: ${d.name}
Address: ${d.formatted_address}
Phone: ${d.formatted_phone_number ?? ""}
Rating: ${d.rating ?? "N/A"} (${d.user_ratings_total ?? 0} reviews)
Hours: ${hours}
Description: ${description}
Business Type: ${types}
Website: ${d.website ?? ""}

Return ONLY a raw JSON object (no markdown, no explanation) matching this exact structure:

{
  "businessName": "${d.name}",
  "legalName": "... LLC",
  "tagline": "Write a compelling one-line tagline for this business",
  "niche": "one word describing what they do",
  "phone": "${d.formatted_phone_number ?? ""}",
  "phoneHref": "tel:+1${(d.formatted_phone_number ?? "").replace(/\D/g, "")}",
  "email": "",
  "location": "City, State extracted from address",
  "businessHours": ["Mon-Fri Xam-Xpm", "Sat Xam-Xpm"],
  "colors": {
    "50": "#...", "100": "#...", "200": "#...", "300": "#...", "400": "#...",
    "500": "#...", "600": "#...", "700": "#...", "800": "#...", "900": "#...", "950": "#..."
  },
  "metaTitle": "...",
  "metaDescription": "...",
  "metaKeywords": "...",
  "heroTagline": "Short hero eyebrow text",
  "heroPrimaryButton": { "text": "Get a Free Quote", "href": "#contact" },
  "heroSecondaryButton": { "text": "See Our Work", "href": "#gallery" },
  "heroVideos": [],
  "aboutSectionLabel": "Our Story",
  "aboutHeading": { "line1": "Line 1 of heading", "line2": "Line 2 of heading" },
  "aboutParagraphs": ["Paragraph 1 about this business (2-3 sentences)", "Paragraph 2", "Paragraph 3"],
  "aboutImage": "${photo0}",
  "aboutImageAlt": "...",
  "yearsExperience": "10+",
  "stats": [
    { "value": "${d.rating ?? "5.0"}★", "label": "Average Rating" },
    { "value": "${d.user_ratings_total ?? 100}+", "label": "Happy Customers" },
    { "value": "10+", "label": "Years of Experience" }
  ],
  "services": [
    { "icon": "wrench", "title": "Service 1 name", "description": "...", "image": "${photo1}" },
    { "icon": "layoutgrid", "title": "Service 2 name", "description": "...", "image": "${photo2}" },
    { "icon": "sun", "title": "Service 3 name", "description": "...", "image": "${photo3}" }
  ],
  "processSteps": [
    { "icon": "messagecircle", "number": "01", "title": "Free Consultation", "description": "..." },
    { "icon": "filetext", "number": "02", "title": "Custom Quote", "description": "..." },
    { "icon": "shovel", "number": "03", "title": "Expert Work", "description": "..." },
    { "icon": "checkcheck", "number": "04", "title": "Your Satisfaction", "description": "..." }
  ],
  "galleryImages": [
    ${photoJson || `{ "src": "", "alt": "Gallery photo" }`}
  ],
  "contactImage": "${photo0}",
  "contactSectionLabel": "Get In Touch",
  "contactHeading": { "line1": "Ready to Get Started?", "line2": "Contact Us Today" },
  "contactSubheading": "Write 1-2 sentences inviting the customer to reach out.",
  "footerDescription": "One sentence footer description of this business.",
  "footerTagline": "A short memorable brand tagline.",
  "footerServices": ["Service 1", "Service 2", "Service 3", "Service 4", "Service 5"]
}

RULES:
- Colors: Generate a UNIQUE brand-appropriate 11-shade palette based on the business type. You MUST pick a hue that matches the industry — do NOT default to navy blue. Examples by type: landscaping/lawn → rich forest green (#1a4d2e range); hardscape/concrete → warm slate/charcoal (#2d3436 range); pressure washing → electric teal (#006d6d range); painting → deep burgundy or terracotta (#6b2737 or #b5451b range); plumbing → steel blue (#1a3a5c is OK here only); roofing → dark brown/espresso (#3b1f0e range); tree service → deep olive green (#3b4a1a range); barber → rich black with gold accents (#1a1a1a range); electrician → deep amber/orange (#7a3b00 range); HVAC → slate grey (#2a3540 range). Generate the full 11 shades (50 through 950) as a proper monochromatic scale. The 950 shade should be very dark and is used for the hero/footer background.
- Services: infer 3 real specific services from the business type. Use icon names only from: pencil, layoutgrid, treepine, snowflake, wrench, droplets, sun, leaf.
- processSteps icons use only: messagecircle, filetext, shovel, refreshcw, checkcheck.
- businessHours: parse from the hours string if available, otherwise write typical hours for this business type.
- aboutParagraphs: write compelling, specific copy for this type of business. Do NOT use the business name excessively.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });

      const rawText = response.content[0].type === "text" ? response.content[0].text : "";
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let config: Record<string, unknown>;
      try {
        config = JSON.parse(cleaned);
      } catch {
        await send({ step: "error", message: "Failed to parse Claude's response. Please try again." });
        return;
      }

      // Inject real Google reviews (up to 5, skip empty text)
      const reviews = (d.reviews ?? [])
        .filter((r: { text?: string }) => r.text?.trim())
        .slice(0, 5)
        .map((r: { author_name: string; rating: number; text: string; relative_time_description: string; profile_photo_url?: string }) => ({
          author: r.author_name,
          rating: r.rating,
          text: r.text.trim(),
          time: r.relative_time_description,
          photo: r.profile_photo_url,
        }));
      config.reviews = reviews;

      // ── Step 5: Save to Supabase ───────────────────────────────────────────
      await send({ step: "saving", message: "Saving to database..." });

      let slug = generateSlug(d.name);
      const { data: existing } = await supabase.from("sites").select("slug").eq("slug", slug).maybeSingle();
      if (existing) slug = `${slug}-${Date.now().toString(36)}`;

      const { error: dbError } = await supabase.from("sites").insert({
        slug,
        business_name: d.name,
        config,
        photos: photoUrls,
        place_id: placeId,
        status: "preview",
      });

      if (dbError) {
        await send({ step: "error", message: `Database error: ${dbError.message}` });
        return;
      }

      // ── Done ──────────────────────────────────────────────────────────────
      await send({
        step: "done",
        message: "Done",
        result: {
          businessName: d.name,
          slug,
          previewUrl: `https://preview.mallardcreative.net/preview/${slug}`,
          photosCount: photoUrls.length,
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
