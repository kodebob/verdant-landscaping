import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a world-class landscape designer with 20+ years of experience transforming residential properties across the country. Your expertise spans horticulture, hardscaping, sustainable landscaping, irrigation design, and outdoor living spaces.

When presented with a photo or description of a property, provide a detailed, professional landscape design report. Structure your response with these exact sections using markdown headers:

# Landscape Design Vision

A compelling 2-3 sentence overview of your design philosophy for this specific space.

## Current Assessment

What you observe about the existing space — its strengths, challenges, and untapped potential.

## Recommended Plant Palette

List 5-7 specific plants with their common and botanical names, plus a brief care note for each. Choose plants appropriate to the region and design aesthetic.

## Hardscape & Structural Elements

Specific recommendations for patios, pathways, walls, pergolas, water features, or outdoor structures that would elevate this space.

## Seasonal Interest

How the landscape will perform and look across spring, summer, fall, and winter — ensuring year-round beauty.

## Sustainability & Eco Features

Native plants, rain gardens, permeable surfaces, composting, or other eco-conscious recommendations appropriate for this property.

## Investment & Phasing

Phase 1 (Quick wins, under $5k), Phase 2 (Core design, $5k-$20k), Phase 3 (Premium additions, $20k+). Realistic cost ranges and timeframes.

## Your First Three Steps

Three specific, actionable steps the homeowner should take immediately to begin the transformation.

---

Keep your tone professional yet warm and inspiring. Use specific plant names, materials, and design terms. Make the homeowner excited about their landscape's potential.`;

async function generateLandscapeImage(designPrompt: string): Promise<string | null> {
  try {
    const response = await genai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: designPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
        outputMimeType: "image/jpeg",
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    return imageBytes ?? null;
  } catch (err) {
    console.error("Gemini image generation error:", err);
    return null;
  }
}

function buildImagePrompt(designContext: string): string {
  const lines = designContext.split("\n").slice(0, 20).join(" ");
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
          {
            text: "Please analyze this photo of my property and provide a comprehensive landscape design report. Describe exactly what you see, identify the key opportunities and challenges, then craft your full design vision for transforming this outdoor space.",
          },
        ],
      },
    ],
    config: { systemInstruction: SYSTEM_PROMPT },
  });
  return response.text ?? "";
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured." },
      { status: 500 }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    // ── Address-based ──────────────────────────────────────────────
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const address = (body.address as string)?.trim();
      if (!address) {
        return NextResponse.json({ error: "Address is required." }, { status: 400 });
      }

      const prompt = `Please create a detailed landscape design report for the property at: ${address}

Base your analysis on:
- The climate zone, USDA hardiness zone, and typical weather patterns for this region
- Architectural styles and home types common to this area
- Native and regionally well-adapted plants
- Local soil conditions and water considerations
- Landscaping trends and preferences for this market

Craft a comprehensive design vision as if this were a paid proposal for the homeowner.`;

      const report = await generateTextReport(prompt);
      const imagePrompt = buildImagePrompt(`Residential property at ${address}. ${report}`);
      const imageBase64 = await generateLandscapeImage(imagePrompt);

      return NextResponse.json({ report, imageBase64 });
    }

    // ── Photo-based ────────────────────────────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const imageFile = formData.get("image") as File | null;

      if (!imageFile) {
        return NextResponse.json({ error: "Image file is required." }, { status: 400 });
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json(
          { error: "Unsupported image format. Please upload JPG, PNG, or WEBP." },
          { status: 400 }
        );
      }
      if (imageFile.size > 20 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image is too large. Please upload an image under 20MB." },
          { status: 400 }
        );
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      const report = await generateTextReportFromImage(base64, imageFile.type);
      const imagePrompt = buildImagePrompt(report);
      const imageBase64 = await generateLandscapeImage(imagePrompt);

      return NextResponse.json({ report, imageBase64 });
    }

    return NextResponse.json({ error: "Unsupported request format." }, { status: 400 });
  } catch (err) {
    console.error("Visualizer API error:", err);
    const msg = err instanceof Error ? err.message : "Failed to generate design report.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
