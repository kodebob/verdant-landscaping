import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRANSFORM_PROMPT = `You are a professional landscape designer creating a before-and-after visualization for a landscaping company. I am giving you a photo of a residential property. Generate a clearly improved version of this exact photo with realistic, professional landscaping upgrades.

KEEP THESE EXACTLY THE SAME — do not alter at all:
- The house structure, brick, siding, roof, chimney, windows, doors
- The driveway and all paved surfaces
- All existing mature trees — same position, same size, same shape
- All fences and permanent structures
- Parked cars and objects in the scene
- The camera angle and perspective

MAKE THESE CLEARLY VISIBLE IMPROVEMENTS to the landscaping:
- Transform any thin, patchy, or dull grass into a lush, thick, vibrant green lawn — this should be a very noticeable improvement
- Add full, well-defined garden beds along the house foundation filled with dark fresh mulch
- Plant colorful low-maintenance flowers in the beds — black-eyed susans, knockout roses, purple salvia, and ornamental grasses appropriate for Pittsburgh Pennsylvania zone 6b
- Make all bed edges crisp and clean with sharp definition between lawn and beds
- Trim and shape any existing shrubs into neat, manicured forms
- Do NOT add any new trees of any kind
- Add color and vibrancy — the transformation should be clearly visible and impressive

The result must look like a real photograph — photorealistic, not a painting. The house should be instantly recognizable as the same house. The landscaping transformation should be dramatic enough that anyone can see the difference between before and after.

After the image, write 2 sentences describing the key improvements. Be specific and inspiring — no intro phrases.`;

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
