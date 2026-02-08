import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getArticle, updateArticle, deleteArticle, triggerWebsiteRebuild, articleToFrontend } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ article: articleToFrontend(article) });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { slug } = await params;
    const body = await request.json();
    const status = body.draft ? "draft" : (body.status || "published");

    const article = await updateArticle(slug, {
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      category: body.category,
      published_at: body.publishedAt,
      cover_image: body.coverImage,
      tags: body.tags,
      seo_keywords: body.seoKeywords,
      featured: body.featured,
      status,
    });

    // Trigger website rebuild
    await triggerWebsiteRebuild();

    return NextResponse.json({ success: true, article: article ? articleToFrontend(article) : null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update article";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { slug } = await params;
    await deleteArticle(slug);
    await triggerWebsiteRebuild();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete article";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
