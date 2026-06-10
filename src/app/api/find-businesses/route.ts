import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  business_status?: string;
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
      const results: PlaceResult[] = [];
      let pageToken: string | undefined;
      const query = `${niche} in ${city}`;

      while (results.length < count) {
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

        results.push(...(data.results ?? []));
        pageToken = data.next_page_token;

        if (!pageToken || results.length >= count) break;
        await new Promise((r) => setTimeout(r, 2000));
      }

      const batch = results.slice(0, count);

      await send({ type: "total", count: batch.length });

      // Fetch details + optionally PageSpeed in parallel batches of 5
      const BATCH = 5;
      for (let i = 0; i < batch.length; i += BATCH) {
        const chunk = batch.slice(i, i + BATCH);

        await Promise.all(
          chunk.map(async (place) => {
            // Get phone + website from details
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

            // Apply filter
            if (filter === "none" && hasWebsite) return;
            if (filter === "bad" && (!hasWebsite || (websiteScore !== null && websiteScore >= 60))) return;

            const business = {
              type: "result",
              place_id: place.place_id,
              name: d.name ?? place.name,
              phone: d.formatted_phone_number ?? null,
              address: d.formatted_address ?? place.formatted_address,
              has_website: hasWebsite,
              website: d.website ?? null,
              website_score: websiteScore,
            };

            // Upsert to businesses table
            await supabase.from("businesses").upsert({
              name: business.name,
              phone: business.phone,
              address: business.address,
              has_website: business.has_website,
              website_score: business.website_score,
              niche,
              city,
              status: "prospect",
            }, { onConflict: "name,city" }).select().single();

            await send(business);
          })
        );
      }

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
