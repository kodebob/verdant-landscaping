import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRANSFORM_PROMPT = `You are a professional landscape designer. The user has uploaded a photo of their home. Generate a realistic transformed version of this exact same photo showing a beautifully redesigned landscape. Keep the house and structure identical - only change the landscaping. Add lush green grass, manicured garden beds, blooming flowers appropriate for Pittsburgh Pennsylvania climate, a clean stone or brick walkway, trimmed hedges, and mature trees where appropriate. The result should look like a realistic before and after photo - not a drawing or illustration. Realistic, achievable, and something a landscaping company could actually build.

After the image, write 2-3 sentences describing the key changes made and why they enhance the property. Keep it concise and inspiring.`;

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

    const response = await genai.models.generateContent({
      model: "gemini-2.0-flash-exp",
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
      if ((part as { inlineData?: { data?: string; mimeType?: string } }).inlineData?.data) {
        const id = (part as { inlineData: { data: string; mimeType?: string } }).inlineData;
        imageBase64 = id.data;
        mimeType = id.mimeType ?? "image/jpeg";
      } else if (part.text) {
        description += part.text;
      }
    }

    return NextResponse.json({ imageBase64, mimeType, description });
  } catch (err) {
    console.error("Visualizer error:", err);
    const msg = err instanceof Error ? err.message : "Failed to generate design.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
