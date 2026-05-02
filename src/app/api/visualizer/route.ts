import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a professional landscape designer. When given a property photo or address, write a concise landscape design report using these four sections:

# Design Vision
2 sentences on your overall concept for the space.

## Plant Palette
4-5 plants with common name, botanical name, and one care tip each.

## Key Improvements
3-4 bullet points covering the most impactful hardscape, structural, or layout changes.

## Investment Guide
- Quick wins (under $3k)
- Core redesign ($3k–$15k)
- Premium additions ($15k+)

Keep the entire report under 400 words. Be specific, practical, and inspiring.`;

async function generateLandscapeImage(designPrompt: string): Promise<string | null> {
  // Try Gemini native image generation
  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: designPrompt }] }],
      config: { responseModalities: ["IMAGE"] } as object,
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts as Array<{ inlineData?: { data?: string } }>) {
      if (part.inlineData?.data) return part.inlineData.data;
    }
  } catch (err) {
    console.error("Gemini native image gen error:", err);
  }

  // Fallback: try Imagen
  try {
    const response = await genai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: designPrompt,
      config: { numberOfImages: 1, aspectRatio: "16:9", outputMimeType: "image/jpeg" },
    });
    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    return imageBytes ?? null;
  } catch (err) {
    console.error("Imagen error:", err);
    return null;
  }
}

function buildImagePrompt(designContext: string): string {
  const lines = designContext.split("\n").slice(0, 10).join(" ");
  return `Photorealistic professional landscape architecture render of a beautifully redesigned residential property exterior. ${lines}. Lush healthy lawn, mature plantings, elegant hardscape. Bright natural daylight, ultra high quality landscape photography, no people, no text, no watermarks.`;
}

async function generateTextReport(prompt: string): Promise<string> {
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { systemInstruction: SYSTEM_PROMPT },
  });
  return response.text ?? "";
}

async function generateTextReportFromImage(base64: string, mimeType: string): Promise<string> {
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: "Analyze this property photo and write a concise landscape design report." },
        ],
      },
    ],
    config: { systemInstruction: SYSTEM_PROMPT },
  });
  return response.text ?? "";
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const address = (body.address as string)?.trim();
      if (!address) {
        return NextResponse.json({ error: "Address is required." }, { status: 400 });
      }

      const prompt = `Write a concise landscape design report for the property at: ${address}. Base plant and design recommendations on the region's climate, hardiness zone, native species, and typical home styles.`;

      const report = await generateTextReport(prompt);
      const imageBase64 = await generateLandscapeImage(buildImagePrompt(`Property at ${address}. ${report}`));

      return NextResponse.json({ report, imageBase64 });
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const imageFile = formData.get("image") as File | null;

      if (!imageFile) {
        return NextResponse.json({ error: "Image file is required." }, { status: 400 });
      }
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(imageFile.type)) {
        return NextResponse.json({ error: "Unsupported format. Upload JPG, PNG, or WEBP." }, { status: 400 });
      }
      if (imageFile.size > 20 * 1024 * 1024) {
        return NextResponse.json({ error: "Image too large. Max 20MB." }, { status: 400 });
      }

      const base64 = Buffer.from(await imageFile.arrayBuffer()).toString("base64");
      const report = await generateTextReportFromImage(base64, imageFile.type);
      const imageBase64 = await generateLandscapeImage(buildImagePrompt(report));

      return NextResponse.json({ report, imageBase64 });
    }

    return NextResponse.json({ error: "Unsupported request format." }, { status: 400 });
  } catch (err) {
    console.error("Visualizer API error:", err);
    const msg = err instanceof Error ? err.message : "Failed to generate design report.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
