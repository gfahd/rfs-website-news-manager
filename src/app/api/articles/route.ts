import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getArticles, createArticle, generateSlug, triggerWebsiteRebuild, articleToFrontend } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const articles = await getArticles();
  return NextResponse.json({ articles: articles.map(articleToFrontend) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const slug = generateSlug(body.title);
    const status = body.draft ? "draft" : (body.status || "published");

    const article = await createArticle({
      slug,
      title: body.title,
      excerpt: body.excerpt || "",
      content: body.content || "",
      category: body.category || "technology",
      published_at: body.publishedAt || new Date().toISOString(),
      cover_image: body.coverImage || "",
      tags: body.tags || [],
      seo_keywords: body.seoKeywords || [],
      author: body.author || "Red Flag Security Team",
      featured: body.featured || false,
      status,
    });

    // Trigger website rebuild after publishing
    if (status !== "draft") {
      await triggerWebsiteRebuild();
    }

    return NextResponse.json({ success: true, slug, article: article ? articleToFrontend(article) : null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create article";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
