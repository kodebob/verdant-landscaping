import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

    // Step 1 — Gemini analyzes the photo and describes the house in precise detail
    const analysisResponse = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: imageFile.type, data: base64 } },
            {
              text: `Describe this home's exterior in precise photographic detail for use in an image generation prompt. Cover:
- Architectural style (colonial, ranch, craftsman, etc.)
- Number of stories
- Exterior material and exact color (brick color, siding color, stone type)
- Roof style and color
- Window style, trim color, and shutter color if present
- Garage (attached/detached, number of doors, color)
- Driveway material and layout
- Current landscaping condition
- Time of day and lighting in the photo
- Surrounding environment (suburban street, trees nearby, etc.)

Be very specific with colors. Output only the description — no intro or explanation.`,
            },
          ],
        },
      ],
    });

    const houseDescription = analysisResponse.text ?? "";

    // Step 2 — Generate transformed landscape using Imagen 4 with the detailed house description
    const imagePrompt = `Photorealistic exterior photo of a ${houseDescription}. The landscaping has been professionally redesigned: lush manicured green lawn, full garden beds with blooming flowers for Pittsburgh Pennsylvania climate (coneflowers, black-eyed susans, ornamental grasses, hydrangeas, boxwoods), a clean natural stone walkway leading to the front door, neatly trimmed foundation hedges, and mature shade trees framing the property. Same lighting and perspective as the original photo. Ultra-realistic landscape photography quality, no people, no text, no watermarks.`;

    const imageResponse = await genai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: imagePrompt,
      config: { numberOfImages: 1, aspectRatio: "16:9" },
    });

    const imageBase64 = imageResponse.generatedImages?.[0]?.image?.imageBytes ?? null;
    if (!imageBase64) {
      return NextResponse.json({ error: "Image generation returned no result. Please try again." }, { status: 500 });
    }

    // Step 3 — Short inspiring description of what changed
    const descResponse = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Write 2 sentences describing a professional landscape transformation for a Pittsburgh Pennsylvania home. Mention the new lawn, garden beds with native flowers, stone walkway, and mature shade trees. Be specific and inspiring. No intro phrases — start directly with the improvements.` }],
        },
      ],
    });
    const description = descResponse.text ?? "";

    return NextResponse.json({ imageBase64, mimeType: "image/jpeg", description });
  } catch (err) {
    console.error("Visualizer error:", err);
    const msg = err instanceof Error ? err.message : "Failed to generate design.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
