import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRANSFORM_PROMPT = `You are an expert landscape architect and designer with 20 years of experience. I am giving you a photo of a residential property. Your job is to redesign the landscaping of this exact home.

Keep the following exactly the same — do NOT remove, move, or alter any of these:
- The house structure, walls, roof, windows, doors
- The driveway and all paved surfaces
- Every fence, railing, post, and gate — keep them exactly as they are
- All existing trees — keep every tree exactly where it is, same size, same shape. Do NOT add any new trees.
- All parked cars and objects in the scene
- Any permanent structures, utility poles, mailboxes, lampposts
- The perspective and camera angle of the photo

Never remove anything that exists in the original photo. Only add or improve — never subtract.

Only change and improve the landscaping. Make these realistic improvements:
- Replace any dead, patchy, or overgrown grass with a thick lush green lawn
- Add clean defined garden beds along the foundation of the house
- Plant low maintenance flowers and shrubs that thrive in Pittsburgh Pennsylvania zone 6b climate such as black eyed susans, knockout roses, ornamental grasses, and boxwoods
- Add clean mulch to all garden beds
- If there is a walkway make it clean and defined with stone or brick edging
- Trim and shape any existing shrubs that are kept
- Make it look like a professional landscaping crew just finished the job

The final image should look like a realistic photograph, not a painting or illustration. It should look achievable and buildable by a real landscaping company. The transformation should be impressive but not fantasy — a realistic high end residential landscape job.

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
