// ============================================
// FILE: src/app/api/ai/route.ts
// Gemini AI API – generate_article, improve_text, generate_metadata, extract_from_url, generate_image_prompt
// ============================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY
  ? new GoogleGenerativeAI(GEMINI_API_KEY)
  : null;

const VALID_ACTIONS = [
  "generate_article",
  "improve_text",
  "generate_metadata",
  "extract_from_url",
  "generate_image_prompt",
] as const;

type Action = (typeof VALID_ACTIONS)[number];
type ModelId = "gemini-2.5-flash" | "gemini-2.0-flash" | "gemini-3-flash-preview";

const GENERATE_ARTICLE_SYSTEM = `You are a professional content writer for Red Flag Security, a Canadian company that installs alarm systems, CCTV cameras, access control systems, and provides 24/7 alarm monitoring. Write informative, engaging blog articles. Use proper markdown formatting with ## for headings, **bold** for emphasis, and clear paragraph structure. Include an introduction, multiple sections with headings, and a conclusion. Do NOT include the title as an H1 — just the body content. Include internal link suggestions at the end formatted as: 'Internal Links: [text](url suggestion)' and external reference suggestions as: 'External Links: [text](url suggestion)'.`;

const IMPROVE_TEXT_DEFAULT =
  "Fix grammar, spelling, and punctuation. Improve clarity and readability. Maintain the original meaning and tone. Return only the improved text, nothing else.";

const GENERATE_METADATA_SYSTEM = `Analyze this article and generate metadata. Respond in valid JSON only, no markdown fences, with this exact structure: { "title": "SEO-optimized article title", "excerpt": "compelling 1-2 sentence summary under 160 characters", "category": "one of: threat-intel, technology, company-news, guides, security-tips, industry-trends", "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"], "seoKeywords": ["keyword1", "keyword2", "keyword3"] }`;

const EXTRACT_FROM_URL_SYSTEM = `You are given content from a URL. Generate a completely original, SEO-optimized article inspired by the topic. The article should be relevant to Red Flag Security (alarm systems, CCTV, access control, monitoring). Do NOT copy any content — write fresh content. Use proper markdown formatting with ## headings, **bold**, bullet points where appropriate. Include 800-1200 words. Also generate metadata. Respond in valid JSON only, no markdown fences: { "content": "the full article in markdown", "title": "SEO title", "excerpt": "summary under 160 chars", "category": "one of: threat-intel, technology, company-news, guides, security-tips, industry-trends", "tags": ["array of 5 tags"], "seoKeywords": ["array of 3 keywords"] }`;

const GENERATE_IMAGE_PROMPT_SYSTEM = `Based on this article title and content, generate a detailed image description for a professional blog cover image. The image should be modern, professional, and related to security/technology. Describe the scene, colors, style, and mood. Keep it under 100 words. Return only the description, nothing else.`;

async function fetchUrlContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "RedFlagSecurity-Bot/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";
  const bodyMatch = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
  const snippet = [title, body.slice(0, 4000)].filter(Boolean).join("\n\n");
  return snippet;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!genAI || !GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API is not configured" },
      { status: 503 }
    );
  }

  let body: { action?: string; model?: string; payload?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { action, model, payload } = body;
  if (!action || !VALID_ACTIONS.includes(action as Action)) {
    return NextResponse.json(
      { error: "Invalid or missing action" },
      { status: 400 }
    );
  }

  const modelId: ModelId =
    model === "gemini-2.0-flash"
      ? "gemini-2.0-flash"
      : model === "gemini-3-flash-preview"
        ? "gemini-3-flash-preview"
        : "gemini-2.5-flash";

  try {
    if (action === "generate_article") {
      const { topic, tone, length } = (payload || {}) as {
        topic?: string;
        tone?: string;
        length?: "short" | "medium" | "long";
      };
      if (!topic || typeof topic !== "string") {
        return NextResponse.json(
          { error: "Payload must include topic" },
          { status: 400 }
        );
      }
      const geminiModel = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: GENERATE_ARTICLE_SYSTEM,
      });
      const lengthHint =
        length === "short"
          ? "Keep it concise (about 400–600 words)."
          : length === "long"
            ? "Write a comprehensive article (about 1200–1500 words)."
            : "Aim for about 800–1000 words.";
      const userPrompt = `Topic: ${topic}${tone ? `\nTone: ${tone}` : ""}\n${lengthHint}`;
      const result = await geminiModel.generateContent(userPrompt);
      const text = result.response.text();
      return NextResponse.json({ content: text });
    }

    if (action === "improve_text") {
      const { text, instruction } = (payload || {}) as {
        text?: string;
        instruction?: string;
      };
      if (!text || typeof text !== "string") {
        return NextResponse.json(
          { error: "Payload must include text" },
          { status: 400 }
        );
      }
      const geminiModel = genAI.getGenerativeModel({ model: modelId });
      const inst =
        typeof instruction === "string" && instruction.trim()
          ? instruction.trim()
          : IMPROVE_TEXT_DEFAULT;
      const userPrompt = `Instruction: ${inst}\n\nText to improve:\n\n${text}`;
      const result = await geminiModel.generateContent(userPrompt);
      const improved = result.response.text();
      return NextResponse.json({ text: improved });
    }

    if (action === "generate_metadata") {
      const { content, title } = (payload || {}) as {
        content?: string;
        title?: string;
      };
      if (!content || typeof content !== "string") {
        return NextResponse.json(
          { error: "Payload must include content" },
          { status: 400 }
        );
      }
      const geminiModel = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: GENERATE_METADATA_SYSTEM,
      });
      const userPrompt = title
        ? `Title (optional context): ${title}\n\nArticle content:\n\n${content}`
        : content;
      const result = await geminiModel.generateContent(userPrompt);
      const raw = result.response.text().trim();
      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        return NextResponse.json(
          { error: "Model did not return valid JSON", raw },
          { status: 502 }
        );
      }
      return NextResponse.json(json);
    }

    if (action === "extract_from_url") {
      const { url } = (payload || {}) as { url?: string };
      if (!url || typeof url !== "string") {
        return NextResponse.json(
          { error: "Payload must include url" },
          { status: 400 }
        );
      }
      let pageContent: string;
      try {
        pageContent = await fetchUrlContent(url);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch URL";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      const geminiModel = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: EXTRACT_FROM_URL_SYSTEM,
      });
      const userPrompt = `URL: ${url}\n\nContent from the page (for topic context only; do not copy):\n\n${pageContent}`;
      const result = await geminiModel.generateContent(userPrompt);
      const raw = result.response.text().trim();
      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        return NextResponse.json(
          { error: "Model did not return valid JSON", raw },
          { status: 502 }
        );
      }
      return NextResponse.json(json);
    }

    if (action === "generate_image_prompt") {
      const { title, content } = (payload || {}) as {
        title?: string;
        content?: string;
      };
      if (!title && !content) {
        return NextResponse.json(
          { error: "Payload must include title or content" },
          { status: 400 }
        );
      }
      const geminiModel = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: GENERATE_IMAGE_PROMPT_SYSTEM,
      });
      const userPrompt = `Title: ${title || "Untitled"}\n\nContent (excerpt):\n${(content || "").slice(0, 2000)}`;
      const result = await geminiModel.generateContent(userPrompt);
      const prompt = result.response.text();
      return NextResponse.json({ prompt });
    }
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Unknown error";
    const isRateLimit =
      /rate|quota|429|resource_exhausted/i.test(message);
    return NextResponse.json(
      { error: isRateLimit ? "Rate limit exceeded. Please try again later." : message },
      { status: isRateLimit ? 429 : 500 }
    );
  }

  return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
}
