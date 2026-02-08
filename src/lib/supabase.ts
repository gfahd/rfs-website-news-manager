import { createClient } from "@supabase/supabase-js";

// Service role client — full access, used in API routes only
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Public client — read-only published articles
const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export { supabaseAdmin, supabasePublic };

// ============ Article Types ============

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  published_at: string;
  cover_image: string;
  tags: string[];
  seo_keywords: string[];
  author: string;
  featured: boolean;
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
}

// ============ Frontend mapping ============

export function articleToFrontend(article: Article) {
  return {
    ...article,
    publishedAt: article.published_at,
    coverImage: article.cover_image,
    seoKeywords: article.seo_keywords,
    draft: article.status === "draft",
  };
}

// ============ Article CRUD ============

export async function getArticles(): Promise<Article[]> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
  return data || [];
}

export async function getArticle(slug: string): Promise<Article | null> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching article:", error);
    return null;
  }
  return data;
}

export async function createArticle(article: Omit<Article, "id" | "created_at" | "updated_at">): Promise<Article | null> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert(article)
    .select()
    .single();

  if (error) {
    console.error("Error creating article:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function updateArticle(slug: string, updates: Partial<Article>): Promise<Article | null> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .update(updates)
    .eq("slug", slug)
    .select()
    .single();

  if (error) {
    console.error("Error updating article:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteArticle(slug: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("articles")
    .delete()
    .eq("slug", slug);

  if (error) {
    console.error("Error deleting article:", error);
    throw new Error(error.message);
  }
}

// ============ Image Upload ============

function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
  };
  return map[mimeType.toLowerCase()] || ".jpg";
}

export async function uploadImage(
  filename: string,
  base64Content: string,
  mimeType: string
): Promise<string> {
  // Clean filename and get proper extension
  const nameWithoutExt = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/\.[^.]+$/, "");
  const ext = getExtensionFromMime(mimeType);
  const timestamp = Date.now();
  const finalFilename = `${timestamp}-${nameWithoutExt}${ext}`;

  // Convert base64 to Buffer
  const buffer = Buffer.from(base64Content, "base64");

  // Upload to Supabase Storage
  const { error } = await supabaseAdmin.storage
    .from("news-images")
    .upload(finalFilename, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error("Error uploading image:", error);
    throw new Error(error.message);
  }

  // Return the public URL
  const { data: urlData } = supabaseAdmin.storage
    .from("news-images")
    .getPublicUrl(finalFilename);

  return urlData.publicUrl;
}

export async function getImages(): Promise<Array<{ name: string; url: string; path: string; size: number }>> {
  const { data, error } = await supabaseAdmin.storage
    .from("news-images")
    .list("", { limit: 200, sortBy: { column: "name", order: "desc" } });

  if (error) {
    console.error("Error listing images:", error);
    return [];
  }

  return (data || [])
    .filter((file) => /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(file.name))
    .map((file) => {
      const { data: urlData } = supabaseAdmin.storage
        .from("news-images")
        .getPublicUrl(file.name);
      const url = urlData.publicUrl;
      return {
        name: file.name,
        url,
        path: url,
        size: file.metadata?.size || 0,
      };
    });
}

// ============ Trigger Website Rebuild ============

export async function triggerWebsiteRebuild(): Promise<boolean> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || "gfahd";
    const repo = "rfs-website";

    if (!token) {
      console.warn("No GITHUB_TOKEN — skipping website rebuild trigger");
      return false;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "content_update",
          client_payload: { triggered_by: "admin-app" },
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to trigger rebuild:", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error triggering rebuild:", error);
    return false;
  }
}

// Helper: generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}
