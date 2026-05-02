import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRANSFORM_PROMPT = `I am giving you a photo of a residential home. Your goal is maximum curb appeal while keeping the property 100% recognizable. Think: this home just won yard of the month.

NEVER change these — they must be pixel-perfect identical:
- Every fence, post, railing, and gate — do not touch
- The walkway, driveway, and all paved surfaces — do not change
- The house structure, brick, siding, roof, chimney, windows, doors
- All existing trees — same position, same size, same shape
- Parked cars and any objects in the scene
- The camera angle and perspective

IMPROVE only the soft landscaping to achieve stunning curb appeal:
- Make the lawn thick, lush, and deeply green — the best lawn on the street
- Fill all existing garden beds with rich dark mulch and plant them full of colorful seasonal flowers — black-eyed susans, knockout roses, purple coneflowers, ornamental grasses layered for depth and color
- Make the edges between the lawn and beds razor sharp and defined
- Trim and shape all existing shrubs into clean, manicured forms
- Add seasonal color and visual richness without adding any new structures or trees

The photo must look photorealistic — like a professional real estate photo taken on a perfect summer day after a master landscaping crew finished. The house must be immediately recognizable as the same house. Stunning but achievable.

After the image, write 2 sentences describing the improvements. Be vivid and inspiring — no intro phrases.`;

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
      model: "gemini-2.5-flash-image",
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
