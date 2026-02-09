import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

// Map text models to their image-capable counterparts
const IMAGE_MODEL_MAP: Record<string, string> = {
  "gemini-2.5-flash": "gemini-2.5-flash-image",
  "gemini-2.0-flash": "gemini-2.5-flash-image",  // 2.0 has no image model, use 2.5
  "gemini-3-pro-preview": "gemini-3-pro-image-preview",
  "gemini-3-pro-image-preview": "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image": "gemini-2.5-flash-image",
};

// Available image models for the frontend dropdown
export const IMAGE_MODELS = [
  { id: "gemini-2.5-flash-image", name: "Nano Banana (Fast)", description: "Fast generation, 1K resolution" },
  { id: "gemini-3-pro-image-preview", name: "Nano Banana Pro (Quality)", description: "Higher quality, 4K, better editing" },
];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { action, prompt, imageBase64, imageMimeType, aspectRatio, model } = await request.json();
    const settings = await getSettings();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // Determine which image model to use
    const imageModel = IMAGE_MODEL_MAP[model] || "gemini-2.5-flash-image";

    let requestBody: any;

    if (action === "generate") {
      // TEXT TO IMAGE
      const fullPrompt = `Generate a professional, high-quality blog cover image for ${settings.company_name || "RedFlag Security"}, a security company that provides alarm systems, CCTV, access control, and 24/7 monitoring.

Image requirements:
- Professional, clean, modern photorealistic style
- Suitable as a blog article header/cover image
- NO text, NO watermarks, NO logos in the image
- Rich detail and good composition
- Colors that work with a dark navy and red brand palette

${settings.ai_instructions ? `Brand guidelines: ${settings.ai_instructions}` : ""}

Create this image: ${prompt}`;

      requestBody = {
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          ...(imageModel === "gemini-3-pro-image-preview" 
            ? { imageConfig: { aspectRatio: aspectRatio || "16:9", imageSize: "2K" } }
            : { imageConfig: { aspectRatio: aspectRatio || "16:9" } }
          ),
        },
      };

    } else if (action === "edit") {
      // IMAGE EDITING — image + text instruction
      if (!imageBase64) {
        return NextResponse.json({ error: "No image provided for editing" }, { status: 400 });
      }

      const editPrompt = `IMPORTANT: You MUST modify and change the provided image according to these instructions. Do NOT return the original image unchanged. Apply the following edits:

${prompt}

Additional context: This image is for ${settings.company_name || "RedFlag Security"}'s blog. Maintain professional quality.
${settings.ai_instructions ? `Brand guidelines: ${settings.ai_instructions}` : ""}

Apply these edits to the provided image and return the MODIFIED version.`;

      requestBody = {
        contents: [{
          parts: [
            { text: editPrompt },
            {
              inlineData: {
                mimeType: imageMimeType || "image/jpeg",
                data: imageBase64,
              }
            }
          ]
        }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          ...(imageModel === "gemini-3-pro-image-preview"
            ? { imageConfig: { aspectRatio: aspectRatio || "16:9", imageSize: "2K" } }
            : { imageConfig: { aspectRatio: aspectRatio || "16:9" } }
          ),
        },
      };

    } else {
      return NextResponse.json({ error: "Invalid action. Use 'generate' or 'edit'" }, { status: 400 });
    }

    // Call the Gemini REST API directly
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `API returned ${response.status}`;
      console.error("Gemini Image API error:", errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();

    // Extract image from response
    let generatedImageBase64: string | null = null;
    let generatedMimeType = "image/png";
    let responseText = "";

    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data;
          generatedMimeType = part.inlineData.mimeType || "image/png";
        }
        if (part.text) {
          responseText += part.text;
        }
      }
    }

    if (!generatedImageBase64) {
      // Check if there's a block reason
      const blockReason = data.candidates?.[0]?.finishReason;
      const safetyRatings = data.candidates?.[0]?.safetyRatings;
      return NextResponse.json(
        { 
          error: `No image was generated. ${blockReason ? `Reason: ${blockReason}` : "Try rephrasing your prompt."}`,
          details: safetyRatings ? JSON.stringify(safetyRatings) : undefined
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      image: generatedImageBase64,
      mimeType: generatedMimeType,
      text: responseText,
      model: imageModel,
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Image generation failed", details: error.stack },
      { status: 500 }
    );
  }
}
