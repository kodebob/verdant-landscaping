import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
}

async function getPageSpeed(url: string, key: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${key}`,
      { signal: AbortSignal.timeout(15000) }
    );
    const data = await res.json();
    const score = data?.lighthouseResult?.categories?.performance?.score;
    return score != null ? Math.round(score * 100) : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { niche, city, count, filter } = await req.json();
  const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY!;
  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  const send = async (data: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  (async () => {
    try {
      // Try multiple query variations to expand the search area if needed
      const queries = [
        `${niche} in ${city}`,
        `${niche} near ${city}`,
        `${niche} ${city} area`,
        `${niche} ${city} metro`,
        `${niche} services ${city}`,
      ];

      const foundCount = { value: 0 };
      const seenPlaceIds = new Set<string>();

      for (const query of queries) {
        if (foundCount.value >= count) break;

        let pageToken: string | undefined;
        let pageNum = 0;
        const MAX_PAGES = 3;

        while (foundCount.value < count && pageNum < MAX_PAGES) {
          const url = pageToken
            ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${GOOGLE_KEY}`
            : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_KEY}`;

          const res = await fetch(url);
          const data = await res.json();

          if (data.status === "ZERO_RESULTS" || data.status === "INVALID_REQUEST") break;
          if (data.status !== "OK") {
            await send({ type: "error", message: `Places API error: ${data.status}` });
            break;
          }

          const places: PlaceResult[] = (data.results ?? []).filter(
            (p: PlaceResult) => !seenPlaceIds.has(p.place_id)
          );
          pageToken = data.next_page_token;
          pageNum++;

          const BATCH = 5;
          for (let i = 0; i < places.length && foundCount.value < count; i += BATCH) {
            const chunk = places.slice(i, Math.min(i + BATCH, places.length));

            await Promise.all(
              chunk.map(async (place) => {
                if (foundCount.value >= count || seenPlaceIds.has(place.place_id)) return;
                seenPlaceIds.add(place.place_id);

                const detailRes = await fetch(
                  `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website&key=${GOOGLE_KEY}`
                );
                const detailData = await detailRes.json();
                const d = detailData.result ?? {};

                const hasWebsite = !!d.website;
                let websiteScore: number | null = null;

                if (hasWebsite && (filter === "bad" || filter === "both")) {
                  websiteScore = await getPageSpeed(d.website, GOOGLE_KEY);
                }

                if (filter === "none" && hasWebsite) return;
                if (filter === "bad" && (!hasWebsite || (websiteScore !== null && websiteScore >= 60))) return;

                const { data: upserted } = await supabase
                  .from("businesses")
                  .upsert({
                    name: d.name ?? place.name,
                    phone: d.formatted_phone_number ?? null,
                    address: d.formatted_address ?? place.formatted_address,
                    has_website: hasWebsite,
                    website_score: websiteScore,
                    website: d.website ?? null,
                    niche,
                    city,
                  }, { onConflict: "name,city" })
                  .select("id, status")
                  .single();

                foundCount.value++;

                await send({
                  type: "result",
                  place_id: place.place_id,
                  name: d.name ?? place.name,
                  phone: d.formatted_phone_number ?? null,
                  address: d.formatted_address ?? place.formatted_address,
                  has_website: hasWebsite,
                  website: d.website ?? null,
                  website_score: websiteScore,
                  db_id: upserted?.id ?? null,
                  already_contacted: upserted?.status === "contacted",
                });
              })
            );
          }

          if (!pageToken || foundCount.value >= count) break;
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      await send({ type: "total", count: foundCount.value });
      await send({ type: "done" });
    } catch (err) {
      await send({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
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
