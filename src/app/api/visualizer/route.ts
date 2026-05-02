import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRANSFORM_PROMPT = `You are a professional landscape designer. The user has uploaded a photo of their home. Generate a realistic transformed version of this exact same photo showing a beautifully redesigned landscape. Keep the house and structure identical - only change the landscaping. Add lush green grass, manicured garden beds, blooming flowers appropriate for Pittsburgh Pennsylvania climate, a clean stone or brick walkway, trimmed hedges, and mature trees where appropriate. The result should look like a realistic before and after photo - not a drawing or illustration. Realistic, achievable, and something a landscaping company could actually build.

After the image, write 2-3 sentences describing the key landscaping changes made. Be specific and inspiring — no intro phrases, just describe the improvements directly.`;

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
