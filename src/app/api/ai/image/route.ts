// ============================================
// AI Image Generation — Gemini 2.5 Flash Image (Nano Banana)
// Uses official Google AI SDK (@google/genai). Separate from text AI route.
// ============================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { GoogleGenAI } from "@google/genai";

const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

function buildImagePrompt(prompt: string, settings: { company_name?: string; ai_instructions?: string }): string {
  return `Create a professional, high-quality blog cover image for ${settings.company_name || "RedFlag Security"}, a security company.

Image requirements:
- Professional, clean, modern aesthetic
- Suitable as a blog article header/cover image
- No text overlays or watermarks
- Photorealistic or high-quality illustration style
- Colors that complement a dark navy and red brand palette

${settings.ai_instructions ? `Additional instructions: ${settings.ai_instructions}` : ""}

Subject: ${prompt}`;
}

function buildEditPrompt(prompt: string, settings: { company_name?: string; ai_instructions?: string }): string {
  return `Edit this image according to the following instructions. Maintain professional quality suitable for ${settings.company_name || "RedFlag Security"}'s blog.

${settings.ai_instructions ? `Brand guidelines: ${settings.ai_instructions}` : ""}

Edit instructions: ${prompt}`;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API is not configured" }, { status: 503 });
  }

  try {
    const { action, prompt, imageBase64, imageMimeType, aspectRatio } = await request.json();
    const settings = await getSettings();

    const fullPrompt =
      action === "generate"
        ? buildImagePrompt(prompt || "", settings)
        : buildEditPrompt(prompt || "", settings);

    const ai = new GoogleGenAI({ apiKey });

    const config = {
      responseModalities: ["TEXT", "IMAGE"] as const,
      ...(aspectRatio && { imageConfig: { aspectRatio: aspectRatio || "16:9" } }),
    };

    let response;

    if (action === "generate") {
      response = await ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: fullPrompt,
        config,
      });
    } else if (action === "edit" && imageBase64) {
      const imagePart = {
        inlineData: {
          mimeType: imageMimeType || "image/jpeg",
          data: imageBase64,
        },
      };
      response = await ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: [fullPrompt, imagePart],
        config,
      });
    } else {
      return NextResponse.json({ error: "Invalid action or missing image" }, { status: 400 });
    }

    let generatedImageBase64: string | null = null;
    let generatedMimeType = "image/png";
    let responseText = "";

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.text) responseText += part.text;
        const raw = part.inlineData?.data;
        if (raw != null) {
          generatedImageBase64 =
            typeof raw === "string"
              ? raw
              : Buffer.from(new Uint8Array(raw as ArrayBuffer)).toString("base64");
          generatedMimeType = part.inlineData?.mimeType || "image/png";
        }
      }
    }

    if (!generatedImageBase64) {
      return NextResponse.json(
        { error: "No image was generated. Try rephrasing your prompt." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      image: generatedImageBase64,
      mimeType: generatedMimeType,
      text: responseText,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Image generation failed";
    console.error("Image generation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
