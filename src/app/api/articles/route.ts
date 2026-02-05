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
    featured,
    content,
  } = body;

  const date = new Date(publishedAt).toISOString().split("T")[0];
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${date}-${slug}`;

  const tagsArray = Array.isArray(tags) ? tags : [];
  const markdown = `---
title: "${title}"
excerpt: "${excerpt}"
category: "${category}"
publishedAt: "${publishedAt}"
coverImage: "${coverImage || ""}"
tags: [${tagsArray.map((t: string) => `"${t}"`).join(", ")}]
author: "Red Flag Security Team"
featured: ${featured || false}
---

${content}
`;

  await saveArticle(filename, markdown, `Add article: ${title}`);

  return NextResponse.json({ success: true, slug: filename });
}
