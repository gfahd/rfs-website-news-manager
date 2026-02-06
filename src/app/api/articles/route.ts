import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getArticles, saveArticle } from "@/lib/github";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await getArticles();
  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    excerpt,
    category,
    publishedAt,
    coverImage,
    tags = [],
    seoKeywords = [],
    featured,
    draft = false,
    content,
  } = body;

  const date = new Date(publishedAt).toISOString().split("T")[0];
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${date}-${slug}`;

  const tagsArray = Array.isArray(tags) ? tags : [];
  const seoKeywordsArray = Array.isArray(seoKeywords) ? seoKeywords : [];
  const markdown = `---
title: "${title}"
excerpt: "${excerpt}"
category: "${category}"
publishedAt: "${publishedAt}"
coverImage: "${coverImage || ""}"
tags: [${tagsArray.map((t: string) => `"${t}"`).join(", ")}]
seoKeywords: [${seoKeywordsArray.map((k: string) => `"${k}"`).join(", ")}]
author: "Red Flag Security Team"
featured: ${featured || false}
draft: ${draft === true}
---

${content}
`;

  try {
    await saveArticle(filename, markdown, draft ? `Add draft: ${title}` : `Add article: ${title}`);
  } catch (err: unknown) {
    const status = err && typeof err === "object" && "status" in err ? (err as { status: number }).status : 0;
    const msg = err instanceof Error ? err.message : "";
    const is401 = status === 401 || msg.includes("Bad credentials");
    console.error("Save article error:", err);
    return NextResponse.json(
      { error: is401 ? "GitHub authentication failed. Check GITHUB_TOKEN in .env.local." : "Failed to save article." },
      { status: is401 ? 401 : 500 }
    );
  }

  return NextResponse.json({ success: true, slug });
}
