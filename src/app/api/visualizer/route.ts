import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, RawReferenceImage } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EDIT_PROMPT = `Transform only the landscaping of this exact home. Keep the house, driveway, and all structures completely identical — do not alter the building at all. Replace the existing landscaping with: lush manicured green lawn, full garden beds with blooming flowers appropriate for Pittsburgh Pennsylvania (coneflowers, black-eyed susans, ornamental grasses, hydrangeas), a clean stone or brick walkway leading to the front door, neatly trimmed hedges along the foundation, and mature shade trees in appropriate locations. The result must look like a realistic professional landscaping renovation photo of this same property — photorealistic, not a drawing or illustration.`;

const DESCRIPTION_PROMPT = `You are a landscape designer. In 2-3 sentences, describe what landscaping improvements were made to a Pittsburgh Pennsylvania home: new lawn, garden beds with native flowers, stone walkway, trimmed hedges, and shade trees. Be specific and inspiring. No intro phrases like "In this redesign" — just describe the improvements directly.`;

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

    // Use Imagen's editImage — takes the actual photo as a reference and edits only what the prompt specifies
    const refImage = new RawReferenceImage();
    refImage.referenceId = 1;
    refImage.referenceImage = { imageBytes: base64, mimeType: imageFile.type };

    const editResponse = await genai.models.editImage({
      model: "imagen-3.0-capability-001",
      prompt: EDIT_PROMPT,
      referenceImages: [refImage],
      config: { numberOfImages: 1 },
    });

    const imageBase64 = editResponse.generatedImages?.[0]?.image?.imageBytes ?? null;
    if (!imageBase64) {
      return NextResponse.json({ error: "Image editing returned no result. Please try again." }, { status: 500 });
    }

    // Generate a short description with Gemini text
    const descResponse = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: DESCRIPTION_PROMPT }] }],
    });
    const description = descResponse.text ?? "";

    return NextResponse.json({ imageBase64, mimeType: "image/png", description });
  } catch (err) {
    console.error("Visualizer error:", err);
    const msg = err instanceof Error ? err.message : "Failed to generate design.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
