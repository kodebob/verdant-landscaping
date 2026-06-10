import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTodaysRotation, NICHES } from "@/lib/cities";

export const maxDuration = 300;

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
}

const SYNONYMS: Record<string, string[]> = {
  landscaping:           ["landscaping", "lawn care", "lawn service", "lawn mowing", "yard service"],
  hardscape:             ["hardscape", "patio installation", "paver installation", "retaining wall", "masonry"],
  "pressure washing":    ["pressure washing", "power washing", "exterior cleaning", "soft washing"],
  painting:              ["painting contractor", "house painter", "interior painting", "exterior painting"],
  plumbing:              ["plumber", "plumbing service", "drain cleaning", "pipe repair"],
  electrician:           ["electrician", "electrical contractor", "electrical service"],
  "lawn care":           ["lawn care", "lawn service", "grass cutting", "lawn mowing", "landscaping"],
  "fence installation":  ["fence installation", "fence contractor", "fencing company"],
  "concrete contractor": ["concrete contractor", "concrete company", "concrete work", "flatwork"],
  "personal trainer":    ["personal trainer", "fitness trainer", "personal training"],
  roofing:               ["roofing contractor", "roof repair", "roofer"],
  "tree service":        ["tree service", "tree removal", "tree trimming", "arborist"],
};

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY!;
  const { niche, city } = getTodaysRotation();
  const target = 250;

  // Log cron run start
  const { data: cronRun } = await supabase
    .from("cron_runs")
    .insert({ date: new Date().toISOString().slice(0, 10), niche, city, status: "running" })
    .select("id")
    .single();
  const cronId = cronRun?.id;

  const nicheKey = niche.toLowerCase();
  const terms = SYNONYMS[nicheKey] ?? [niche];
  const queries: string[] = [];
  for (const term of terms) {
    queries.push(`${term} in ${city}`);
    queries.push(`${term} near ${city}`);
  }

  const seenPlaceIds = new Set<string>();
  let businessesFound = 0;

  for (const query of queries) {
    if (businessesFound >= target) break;

    let pageToken: string | undefined;
    let pageNum = 0;

    while (businessesFound < target && pageNum < 3) {
      const url = pageToken
        ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${GOOGLE_KEY}`
        : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "ZERO_RESULTS" || data.status === "INVALID_REQUEST") break;
      if (data.status !== "OK") break;

      const places: PlaceResult[] = (data.results ?? []).filter(
        (p: PlaceResult) => !seenPlaceIds.has(p.place_id)
      );
      pageToken = data.next_page_token;
      pageNum++;

      // Process in batches of 5
      for (let i = 0; i < places.length && businessesFound < target; i += 5) {
        const chunk = places.slice(i, i + 5);
        await Promise.all(chunk.map(async (place) => {
          if (businessesFound >= target || seenPlaceIds.has(place.place_id)) return;
          seenPlaceIds.add(place.place_id);

          const detailRes = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website&key=${GOOGLE_KEY}`
          );
          const detail = await detailRes.json();
          const d = detail.result ?? {};

          // Require phone, skip businesses with websites
          if (!d.formatted_phone_number) return;
          if (d.website) return;

          // Deduplicate against Supabase
          const { data: existing } = await supabase
            .from("businesses")
            .select("id")
            .eq("place_id", place.place_id)
            .maybeSingle();
          if (existing) return;

          await supabase.from("businesses").upsert({
            name:        d.name ?? place.name,
            phone:       d.formatted_phone_number,
            address:     d.formatted_address ?? place.formatted_address,
            has_website: false,
            niche,
            city,
            place_id:    place.place_id,
            status:      "queued",
          }, { onConflict: "name,city" });

          businessesFound++;
        }));
      }

      if (!pageToken || businessesFound >= target) break;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Update cron run record
  if (cronId) {
    await supabase
      .from("cron_runs")
      .update({ businesses_found: businessesFound, status: "found" })
      .eq("id", cronId);
  }

  return NextResponse.json({ success: true, niche, city, businessesFound });
}
