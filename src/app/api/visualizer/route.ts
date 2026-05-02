import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRANSFORM_PROMPT = `You are a professional residential landscaper. I am giving you a photo of a home. Make ONLY subtle, realistic landscaping improvements. This should look like a real landscaping crew came and spent one day improving the yard — not a complete fantasy makeover.

NEVER change or remove any of these:
- The house structure, brick, siding, roof, chimney
- Every single window and door exactly as they are
- The driveway and any paved surfaces
- Any existing healthy mature trees — keep every tree exactly where it is, same size, same shape
- Any fences or permanent structures
- Parked cars or other objects
- The exact camera angle and perspective

ONLY make these small realistic improvements:
- Make the grass greener and fuller where it looks thin or patchy
- Add a thin clean layer of fresh dark mulch to any existing garden beds
- Lightly trim and shape any overgrown shrubs that already exist — do not remove them
- Add a small amount of low growing flowers along the foundation only where there is already a garden bed
- Clean up any visible weeds or debris
- Make the edges between the lawn and garden beds look crisp and defined

The final result should look like the same photo on a better day after a professional cleanup. Subtle. Realistic. The homeowner should look at it and think this is actually achievable. Do not add anything that was not already suggested by the existing landscape.

After the image, write 2 sentences describing what was improved. Be specific and grounded — no intro phrases.`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Photo upload required." }, { status: 400 });
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) {
      return NextResponse.json({ error: "Unsupported format. Upload JPG, PNG, or WEBP." }, { status: 400 });
    }
    if (imageFile.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large. Max 20MB." }, { status: 400 });
    }

    const base64 = Buffer.from(await imageFile.arrayBuffer()).toString("base64");

    // gemini-2.5-flash-image accepts image input and outputs both image + text in one call
    const response = await genai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: imageFile.type, data: base64 } },
            { text: TRANSFORM_PROMPT },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];

    let imageBase64: string | null = null;
    let mimeType = "image/jpeg";
    let description = "";

    for (const part of parts) {
      const p = part as { inlineData?: { data?: string; mimeType?: string }; text?: string };
      if (p.inlineData?.data) {
        imageBase64 = p.inlineData.data;
        mimeType = p.inlineData.mimeType ?? "image/jpeg";
      } else if (p.text) {
        description += p.text;
      }
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "No image returned. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ imageBase64, mimeType, description });
  } catch (err) {
    console.error("Visualizer error:", err);
    const msg = err instanceof Error ? err.message : "Failed to generate design.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
