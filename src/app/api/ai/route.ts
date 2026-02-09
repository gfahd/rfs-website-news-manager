// ============================================
// FILE: src/app/api/ai/route.ts
// Gemini AI API – generate_article, improve_text, generate_metadata, extract_from_url, generate_image_prompt
// ============================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettings, type AppSettings } from "@/lib/settings";
import { GoogleGenerativeAI } from "@google/generative-ai";

function buildSystemPromptPrefix(settings: AppSettings): string {
  const parts: string[] = [];
  parts.push(`Company: ${settings.company_name}. ${settings.company_description}`);
  if (settings.website_url) parts.push(`Website: ${settings.website_url}`);
  if (settings.ai_instructions?.trim()) {
    parts.push(`IMPORTANT INSTRUCTIONS: ${settings.ai_instructions.trim()}`);
  }
  if (settings.ai_forbidden_companies?.trim()) {
    const companies = settings.ai_forbidden_companies.trim().split(/\n/).filter(Boolean).join(", ");
    if (companies) parts.push(`NEVER mention these competitors: ${companies}`);
  }
  if (settings.ai_forbidden_topics?.trim()) {
    const topics = settings.ai_forbidden_topics.trim().split(/\n/).filter(Boolean).join(", ");
    if (topics) parts.push(`NEVER write about: ${topics}`);
  }
  if (settings.ai_link_policy === "internal_only" && settings.website_url) {
    parts.push(`Only include links to ${settings.website_url}. No external links.`);
  } else if (settings.ai_link_policy === "no_links") {
    parts.push("Do not include any links.");
  }
  return parts.join("\n\n") + (parts.length > 0 ? "\n\n" : "");
}

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
  "discover_topics",
  "generate_from_topic",
] as const;

type Action = (typeof VALID_ACTIONS)[number];

const GENERATE_ARTICLE_SYSTEM = `You are a professional content writer for Red Flag Security, a Canadian company that installs alarm systems, CCTV cameras, access control systems, and provides 24/7 alarm monitoring. Write informative, engaging blog articles. Use proper markdown formatting with ## for headings, **bold** for emphasis, and clear paragraph structure. Include an introduction, multiple sections with headings, and a conclusion. Do NOT include the title as an H1 — just the body content. Include internal link suggestions at the end formatted as: 'Internal Links: [text](url suggestion)' and external reference suggestions as: 'External Links: [text](url suggestion)'.`;

const IMPROVE_TEXT_DEFAULT =
  "Fix grammar, spelling, and punctuation. Improve clarity and readability. Maintain the original meaning and tone. Return only the improved text, nothing else.";

const GENERATE_METADATA_SYSTEM = `Analyze this article and generate metadata. Respond in valid JSON only, no markdown fences, with this exact structure: { "title": "SEO-optimized article title", "excerpt": "compelling 1-2 sentence summary under 160 characters", "category": "one of: threat-intel, technology, company-news, guides, security-tips, industry-trends", "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"], "seoKeywords": ["keyword1", "keyword2", "keyword3"] }`;

const EXTRACT_FROM_URL_SYSTEM = `You are given content from a URL. Generate a completely original, SEO-optimized article inspired by the topic. The article should be relevant to Red Flag Security (alarm systems, CCTV, access control, monitoring). Do NOT copy any content — write fresh content. Use proper markdown formatting with ## headings, **bold**, bullet points where appropriate. Include 800-1200 words. Also generate metadata. Respond in valid JSON only, no markdown fences: { "content": "the full article in markdown", "title": "SEO title", "excerpt": "summary under 160 chars", "category": "one of: threat-intel, technology, company-news, guides, security-tips, industry-trends", "tags": ["array of 5 tags"], "seoKeywords": ["array of 3 keywords"] }`;

const GENERATE_IMAGE_PROMPT_SYSTEM = `Based on this article title and content, generate a detailed image description for a professional blog cover image. The image should be modern, professional, and related to security/technology. Describe the scene, colors, style, and mood. Keep it under 100 words. Return only the description, nothing else.`;

const DISCOVER_TOPICS_SYSTEM = (companyName: string) =>
  `You are a content strategist for ${companyName}. Generate 6 trending article ideas in the physical security and home/business security industry. Focus on topics relevant to alarm systems, CCTV, access control, and monitoring services. For each idea provide: title, one-sentence description, why it's trending now, suggested category (from the standard categories), and reader interest level (high/medium/low). If a focus area is given, prioritize that. Respond in valid JSON only, no markdown fences: { "topics": [{ "title": "...", "description": "...", "why_trending": "...", "category": "...", "interest": "high" }] }`;

const GENERATE_FROM_TOPIC_SYSTEM = (title: string, description: string, category: string) =>
  `Write a complete blog article with this exact title: '${title}'. Cover this: ${description}. Category: ${category}. Use proper markdown with ## headings, **bold**, clear sections. Write 800-1200 words. Include introduction, multiple sections, and a conclusion with call to action.`;

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

  const settings = await getSettings();
  const allowedValues = settings.ai_models.map((m) => m.value).filter(Boolean);
  const modelId =
    typeof model === "string" && allowedValues.includes(model)
      ? model
      : allowedValues.includes(settings.default_model)
        ? settings.default_model
        : allowedValues[0] ?? "gemini-2.5-flash";
  const systemPrefix = buildSystemPromptPrefix(settings);

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
      const effectiveTone = tone ?? settings.default_tone;
      const lengthFromSettings =
        settings.default_article_length === "short" || settings.default_article_length === "long"
          ? settings.default_article_length
          : "medium";
      const effectiveLength = length ?? lengthFromSettings;
      const geminiModel = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: systemPrefix + GENERATE_ARTICLE_SYSTEM,
      });
      const lengthHint =
        effectiveLength === "short"
          ? "Keep it concise (about 400–600 words)."
          : effectiveLength === "long"
            ? "Write a comprehensive article (about 1200–1500 words)."
            : "Aim for about 800–1000 words.";
      const userPrompt = `Topic: ${topic}${effectiveTone ? `\nTone: ${effectiveTone}` : ""}\n${lengthHint}`;
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
      const improveSystem = systemPrefix + IMPROVE_TEXT_DEFAULT;
      const geminiModel = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: improveSystem,
      });
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
        systemInstruction: systemPrefix + GENERATE_METADATA_SYSTEM,
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
        systemInstruction: systemPrefix + EXTRACT_FROM_URL_SYSTEM,
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
        systemInstruction: systemPrefix + GENERATE_IMAGE_PROMPT_SYSTEM,
      });
      const userPrompt = `Title: ${title || "Untitled"}\n\nContent (excerpt):\n${(content || "").slice(0, 2000)}`;
      const result = await geminiModel.generateContent(userPrompt);
      const prompt = result.response.text();
      return NextResponse.json({ prompt });
    }

    if (action === "discover_topics") {
      const { focus } = (payload || {}) as { focus?: string };
      const systemInstruction =
        systemPrefix +
        DISCOVER_TOPICS_SYSTEM(settings.company_name) +
        (focus && ["residential", "commercial", "cybersecurity", "industry"].includes(focus)
          ? ` Focus area: ${focus}.`
          : "");
      const geminiModel = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction,
      });
      const userPrompt = focus
        ? `Generate 6 trending article ideas. Focus area: ${focus}.`
        : "Generate 6 trending article ideas.";
      const result = await geminiModel.generateContent(userPrompt);
      const raw = result.response.text().trim();
      let json: { topics?: Array<{ title?: string; description?: string; why_trending?: string; category?: string; interest?: string }> };
      try {
        json = JSON.parse(raw.replace(/^```\w*\n?|\n?```$/g, "").trim());
      } catch {
        return NextResponse.json(
          { error: "Model did not return valid JSON", raw },
          { status: 502 }
        );
      }
      const topics = Array.isArray(json?.topics) ? json.topics : [];
      return NextResponse.json({ topics });
    }

    if (action === "generate_from_topic") {
      const { title: topicTitle, description, category: topicCategory } = (payload || {}) as {
        title?: string;
        description?: string;
        category?: string;
      };
      if (!topicTitle || typeof topicTitle !== "string") {
        return NextResponse.json(
          { error: "Payload must include title" },
          { status: 400 }
        );
      }
      const effectiveDesc = typeof description === "string" ? description : "";
      const effectiveCat = typeof topicCategory === "string" ? topicCategory : "technology";
      const systemInstruction =
        systemPrefix + GENERATE_FROM_TOPIC_SYSTEM(topicTitle, effectiveDesc, effectiveCat);
      const geminiModel = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction,
      });
      const userPrompt = `Write the article now.`;
      const result = await geminiModel.generateContent(userPrompt);
      const content = result.response.text();
      return NextResponse.json({ content });
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
