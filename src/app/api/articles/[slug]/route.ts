// ============================================
// FILE: src/app/api/articles/[slug]/route.ts
// Single Article API
// ============================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getArticle, saveArticle, deleteArticle } from "@/lib/github";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const article = await getArticle(slug);
  
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ article });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
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
    content,
  } = body;

  const tagsArray = Array.isArray(tags) ? tags : [];
  const seoKeywordsArray = Array.isArray(seoKeywords) ? seoKeywords : [];

  // Build markdown content
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
---

${content}
`;

  const existing = await getArticle(slug);
  const fileStem = existing?.filename?.replace(/\.md$/, "") ?? slug;
  await saveArticle(fileStem, markdown, `Update article: ${title}`);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const existing = await getArticle(slug);
  if (!existing?.filename) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const fileStem = existing.filename.replace(/\.md$/, "");
  await deleteArticle(fileStem);

  return NextResponse.json({ success: true });
}