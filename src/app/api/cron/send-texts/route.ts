import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { fillPhotos } from "@/lib/stockPhotos";
import { TEMPLATES, FOLLOW_UP_TEMPLATE } from "@/app/api/send-text/route";

export const maxDuration = 300;

// How many to process per hourly run
const CONFIGS_PER_RUN = 20;
const TEXTS_PER_RUN   = 20;

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60).replace(/^-|-$/g, "");
}

function isWithinSendWindow(): boolean {
  const et   = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const hour = new Date(et).getHours();
  return hour >= 9 && hour < 18;
}

async function getAvailableNumber(pool: string[]): Promise<string | null> {
  if (!pool.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("outreach_log")
    .select("twilio_number_used")
    .gte("sent_at", `${today}T00:00:00Z`);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.twilio_number_used) counts[row.twilio_number_used] = (counts[row.twilio_number_used] ?? 0) + 1;
  }
  const available = pool.map((n) => ({ n, count: counts[n] ?? 0 })).filter(({ count }) => count < 50).sort((a, b) => a.count - b.count);
  return available[0]?.n ?? null;
}

async function generateConfig(business: { name: string; address: string; phone: string; place_id: string; niche: string }): Promise<{ slug: string; previewUrl: string } | null> {
  const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY!;

  // Get full place details
  const detailRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${business.place_id}&fields=name,formatted_address,formatted_phone_number,rating,user_ratings_total,opening_hours,photos,editorial_summary,types,reviews&key=${GOOGLE_KEY}`
  );
  const detailData = await detailRes.json();
  const d = detailData.result ?? {};

  // Photos
  const refs: string[] = (d.photos ?? []).slice(0, 10).map((p: { photo_reference: string }) => p.photo_reference);
  const photoUrls: string[] = [];
  for (const ref of refs) {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${ref}&key=${GOOGLE_KEY}`, { redirect: "follow" });
      if (res.url.startsWith("https://lh3.googleusercontent.com")) photoUrls.push(res.url);
    } catch { /* skip */ }
  }
  const types    = (d.types ?? []).filter((t: string) => !["point_of_interest", "establishment"].includes(t));
  const nicheKey = types[0] ?? business.niche ?? "default";
  const photos   = photoUrls.length > 0 ? photoUrls : fillPhotos([], nicheKey, 6);

  const photo0 = photos[0] ?? "";
  const photo1 = photos[1] ?? photo0;
  const photo2 = photos[2] ?? photo0;
  const photo3 = photos[3] ?? photo0;
  const photoJson = photos.map((url, i) => `{ "src": "${url}", "alt": "Photo ${i + 1}" }`).join(",\n    ");
  const hours = (d.opening_hours?.weekday_text ?? []).join(" | ");

  const prompt = `You are a web developer. A client's business was scraped from Google Places. Generate a complete businessConfig JSON object for their website.

BUSINESS DATA:
Name: ${d.name ?? business.name}
Address: ${d.formatted_address ?? business.address}
Phone: ${d.formatted_phone_number ?? business.phone}
Rating: ${d.rating ?? "N/A"} (${d.user_ratings_total ?? 0} reviews)
Hours: ${hours}
Description: ${d.editorial_summary?.overview ?? ""}
Business Type: ${types.join(", ")}

IMPORTANT: Your entire response must be a single raw JSON object. Start your response with { and end with }. No markdown, no code fences, no explanation before or after.

{
  "businessName": "${d.name ?? business.name}",
  "legalName": "... LLC",
  "tagline": "Write a compelling one-line tagline",
  "niche": "one word",
  "phone": "${d.formatted_phone_number ?? business.phone}",
  "phoneHref": "tel:+1${(d.formatted_phone_number ?? business.phone ?? "").replace(/\D/g, "")}",
  "email": "",
  "location": "City, State",
  "businessHours": ["Mon-Fri Xam-Xpm"],
  "colors": { "50":"#...","100":"#...","200":"#...","300":"#...","400":"#...","500":"#...","600":"#...","700":"#...","800":"#...","900":"#...","950":"#..." },
  "metaTitle": "...", "metaDescription": "...", "metaKeywords": "...",
  "heroTagline": "Short hero eyebrow",
  "heroPrimaryButton": { "text": "Get a Free Quote", "href": "#contact" },
  "heroSecondaryButton": { "text": "See Our Work", "href": "#gallery" },
  "heroVideos": [],
  "aboutSectionLabel": "Our Story",
  "aboutHeading": { "line1": "...", "line2": "..." },
  "aboutParagraphs": ["Para 1", "Para 2", "Para 3"],
  "aboutImage": "${photo0}", "aboutImageAlt": "...",
  "yearsExperience": "10+",
  "stats": [
    { "value": "${d.rating ?? "5.0"}★", "label": "Average Rating" },
    { "value": "${d.user_ratings_total ?? 100}+", "label": "Happy Customers" },
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
  "footerServices": ["Service 1","Service 2","Service 3","Service 4","Service 5"]
}

RULES:
- Colors: UNIQUE palette for this business type. Do NOT use navy blue unless it's a plumber. Landscaping→forest green, hardscape→warm slate, pressure washing→teal, painting→burgundy/terracotta, electrician→amber, roofing→dark brown, tree service→olive.
- Services: infer 3 real services. Icons only from: pencil, layoutgrid, treepine, snowflake, wrench, droplets, sun, leaf.
- processSteps icons only: messagecircle, filetext, shovel, refreshcw, checkcheck.`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const response  = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 4000,
    messages:   [{ role: "user", content: prompt }],
  });

  const raw     = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let config: Record<string, unknown>;
  try { config = JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("{");
    const end   = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { config = JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
    } else { return null; }
  }

  // Inject real reviews
  const reviews = (d.reviews ?? [])
    .filter((r: { text?: string }) => r.text?.trim())
    .slice(0, 5)
    .map((r: { author_name: string; rating: number; text: string; relative_time_description: string; profile_photo_url?: string }) => ({
      author: r.author_name, rating: r.rating, text: r.text.trim(),
      time: r.relative_time_description, photo: r.profile_photo_url,
    }));
  config.reviews = reviews;

  let slug = generateSlug(d.name ?? business.name);
  const { data: existing } = await supabase.from("sites").select("slug").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const { error } = await supabase.from("sites").insert({
    slug,
    business_name: d.name ?? business.name,
    config,
    photos,
    place_id: business.place_id,
    status:   "preview",
  });
  if (error) return null;

  return { slug, previewUrl: `https://preview.mallardcreative.net/preview/${slug}` };
}

async function sendSummaryToKody(stats: { configs: number; texts: number; followUps: number }) {
  const kodyPhone = process.env.KODY_PHONE_NUMBER;
  if (!kodyPhone) return;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = (process.env.TWILIO_PHONE_NUMBERS ?? process.env.TWILIO_PHONE_NUMBER ?? "").split(",")[0]?.trim();
  if (!accountSid || !authToken || !fromNumber) return;
  try {
    const twilio = (await import("twilio")).default;
    await twilio(accountSid, authToken).messages.create({
      body: `Mallard run complete: ${stats.configs} configs generated, ${stats.texts} texts sent, ${stats.followUps} follow-ups sent`,
      from: fromNumber,
      to:   kodyPhone,
    });
  } catch { /* non-critical */ }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const pool       = (process.env.TWILIO_PHONE_NUMBERS ?? process.env.TWILIO_PHONE_NUMBER ?? "").split(",").map((n) => n.trim()).filter(Boolean);
  const canText    = !!(accountSid && authToken && pool.length);
  const inWindow   = isWithinSendWindow();

  let configsGenerated = 0;
  let textsSent        = 0;
  let followUpsSent    = 0;

  // ── Step 1: Generate configs for queued businesses ────────────────────────
  const { data: queued } = await supabase
    .from("businesses")
    .select("id, name, phone, address, place_id, niche")
    .eq("status", "queued")
    .not("phone", "is", null)
    .not("place_id", "is", null)
    .limit(CONFIGS_PER_RUN);

  for (const biz of queued ?? []) {
    try {
      const result = await generateConfig(biz as { name: string; address: string; phone: string; place_id: string; niche: string });
      if (result) {
        await supabase.from("businesses").update({ status: "preview" }).eq("id", biz.id);
        configsGenerated++;
      } else {
        await supabase.from("businesses").update({ status: "config_failed" }).eq("id", biz.id);
      }
    } catch {
      await supabase.from("businesses").update({ status: "config_failed" }).eq("id", biz.id);
    }
  }

  // ── Step 2: Send texts for preview-ready businesses ───────────────────────
  if (canText && inWindow) {
    const { data: ready } = await supabase
      .from("businesses")
      .select("id, name, phone, place_id")
      .eq("status", "preview")
      .limit(TEXTS_PER_RUN);

    let templateIdx = 0;
    for (const biz of ready ?? []) {
      const fromNumber = await getAvailableNumber(pool);
      if (!fromNumber) break;

      // Get site slug
      const { data: site } = await supabase
        .from("sites")
        .select("slug")
        .eq("place_id", biz.place_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (!site) continue;

      const previewUrl = `https://preview.mallardcreative.net/preview/${site.slug}`;
      const body = TEMPLATES[templateIdx % TEMPLATES.length](biz.name, previewUrl);

      try {
        const twilio = (await import("twilio")).default;
        const msg = await twilio(accountSid!, authToken!).messages.create({ body, from: fromNumber, to: biz.phone });

        await supabase.from("outreach_log").insert({
          business_id:        biz.id,
          method:             "text",
          message:            body,
          sent_at:            new Date().toISOString(),
          delivery_status:    msg.status,
          twilio_sid:         msg.sid,
          twilio_number_used: fromNumber,
          message_variation:  templateIdx % TEMPLATES.length,
        });
        await supabase.from("businesses").update({ status: "texted" }).eq("id", biz.id);

        // Schedule follow-up 48h from now
        const followUpAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        await supabase.from("follow_ups").insert({
          business_id:    biz.id,
          site_slug:      site.slug,
          scheduled_for:  followUpAt,
          status:         "pending",
        });

        textsSent++;
        templateIdx++;

        // Random 30–60s delay between texts (only sleep if more to send)
        if (textsSent < (ready?.length ?? 0)) {
          await new Promise((r) => setTimeout(r, 30_000 + Math.random() * 30_000));
        }
      } catch { /* log and continue */ }
    }
  }

  // ── Step 3: Send scheduled follow-ups ────────────────────────────────────
  if (canText && inWindow) {
    const now = new Date().toISOString();
    const { data: pendingFollowUps } = await supabase
      .from("follow_ups")
      .select("id, business_id, site_slug, businesses(name, phone)")
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .limit(10);

    for (const fu of pendingFollowUps ?? []) {
      const bizRaw = fu.businesses;
      const biz = (Array.isArray(bizRaw) ? bizRaw[0] : bizRaw) as { name: string; phone: string } | null;
      if (!biz?.phone) continue;

      const fromNumber = await getAvailableNumber(pool);
      if (!fromNumber) break;

      const previewUrl = `https://preview.mallardcreative.net/preview/${fu.site_slug}`;
      const body = FOLLOW_UP_TEMPLATE(biz.name, previewUrl);

      try {
        const twilio = (await import("twilio")).default;
        const msg = await twilio(accountSid!, authToken!).messages.create({ body, from: fromNumber, to: biz.phone });

        await supabase.from("outreach_log").insert({
          business_id:        fu.business_id,
          method:             "follow_up",
          message:            body,
          sent_at:            now,
          delivery_status:    msg.status,
          twilio_sid:         msg.sid,
          twilio_number_used: fromNumber,
        });
        await supabase.from("follow_ups").update({ status: "sent", sent_at: now }).eq("id", fu.id);
        followUpsSent++;

        await new Promise((r) => setTimeout(r, 30_000 + Math.random() * 30_000));
      } catch {
        await supabase.from("follow_ups").update({ status: "failed" }).eq("id", fu.id);
      }
    }
  }

  // Update today's cron run record
  const today = new Date().toISOString().slice(0, 10);
  try {
    await supabase
      .from("cron_runs")
      .update({ configs_generated: configsGenerated, texts_sent: textsSent, status: "done" })
      .eq("date", today);
  } catch { /* non-critical */ }

  // Send summary to Kody if anything meaningful happened
  if (configsGenerated + textsSent + followUpsSent > 0) {
    await sendSummaryToKody({ configs: configsGenerated, texts: textsSent, followUps: followUpsSent });
  }

  return NextResponse.json({ success: true, configsGenerated, textsSent, followUpsSent, inWindow });
}
