// ============================================
// FILE: src/app/articles/page.tsx
// Articles List Page
// ============================================

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { FileText, Plus, Search, Filter, Trash2, Edit } from "lucide-react";
import Link from "next/link";

export default function ArticlesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await fetch("/api/articles");
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchArticles();
    }
  }, [session]);

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      const res = await fetch(`/api/articles/${slug}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setArticles(articles.filter((a: any) => a.slug !== slug));
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const filteredArticles = articles.filter((article: any) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || article.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "threat-intel", label: "Threat Intelligence" },
    { value: "technology", label: "Technology" },
    { value: "company-news", label: "Company News" },
    { value: "guides", label: "Guides & How-To" },
  ];

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Articles</h1>
            <p className="text-slate-400 mt-1">
              Manage your news articles and blog posts
            </p>
          </div>
          <Link
            href="/articles/new"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2.5 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Article
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Articles List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              {searchTerm || filterCategory !== "all"
                ? "No articles match your search."
                : "No articles yet. Create your first one!"}
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filteredArticles.map((article: any) => (
                <div
                  key={article.slug}
                  className="flex items-center gap-4 p-4 hover:bg-slate-700/50 transition-colors"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {article.title}
                      </span>
                      {article.featured && (
                        <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded flex-shrink-0">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 mt-0.5">
                      <span className="capitalize">
                        {article.category.replace("-", " ")}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/articles/${article.slug}`}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(article.slug)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Count */}
        {!loading && (
          <div className="mt-4 text-sm text-slate-500">
            Showing {filteredArticles.length} of {articles.length} articles
          </div>
        )}
      </main>
    </div>
  );
}


// ============================================
// FILE: src/app/articles/new/page.tsx
// New Article Page
// ============================================

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ArrowLeft, Save, Eye, Upload, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function NewArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    category: "company-news",
    publishedAt: new Date().toISOString().slice(0, 16),
    coverImage: "",
    tags: "",
    featured: false,
    content: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch("/api/images");
        const data = await res.json();
        setImages(data.images || []);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      }
    }
    if (session) {
      fetchImages();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          publishedAt: new Date(form.publishedAt).toISOString(),
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        router.push("/articles");
      } else {
        alert("Failed to save article");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            content: base64,
            mimeType: file.type,
          }),
        });

        const data = await res.json();
        if (data.path) {
          setForm({ ...form, coverImage: data.path });
          setImages([...images, { name: file.name, path: data.path }]);
        }
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload image");
      }
    };
    reader.readAsDataURL(file);
  };

  const categories = [
    { value: "threat-intel", label: "Threat Intelligence" },
    { value: "technology", label: "Technology" },
    { value: "company-news", label: "Company News" },
    { value: "guides", label: "Guides & How-To" },
  ];

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/articles"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">New Article</h1>
                <p className="text-slate-400 mt-1">
                  Create a new news article or blog post
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Eye className="w-5 h-5" />
                Preview
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg px-4 py-2.5 font-medium transition-colors"
              >
                <Save className="w-5 h-5" />
                {saving ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter article title..."
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500 text-lg"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Summary
                  <span className="text-slate-500 font-normal ml-2">
                    (appears in previews)
                  </span>
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Brief summary of the article..."
                  required
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500 resize-none"
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cover Image
                </label>
                {form.coverImage ? (
                  <div className="relative aspect-[2/1] rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                    <img
                      src={form.coverImage}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, coverImage: "" })}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <label className="flex-1 flex flex-col items-center justify-center aspect-[2/1] border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-red-500/50 transition-colors">
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-sm text-slate-500">
                        Upload image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowImagePicker(true)}
                      className="flex flex-col items-center justify-center px-8 border border-slate-700 rounded-lg hover:border-red-500/50 transition-colors"
                    >
                      <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-sm text-slate-500">
                        Choose existing
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Article Content
                  <span className="text-slate-500 font-normal ml-2">
                    (Markdown supported)
                  </span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your article content here...

## Use Headings Like This

Regular paragraphs go here.

- Bullet points work
- Like this

**Bold text** and *italic text* are supported."
                  required
                  rows={20}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500 font-mono text-sm resize-none"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Settings Card */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                <h3 className="font-semibold mb-4">Settings</h3>

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-slate-100"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Publish Date */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) =>
                      setForm({ ...form, publishedAt: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-slate-100"
                  />
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Tags
                    <span className="text-slate-500 font-normal ml-2">
                      (comma separated)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="security, tips, ottawa"
                    className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                {/* Featured */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) =>
                        setForm({ ...form, featured: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-red-600 focus:ring-red-500 focus:ring-offset-0"
                    />
                    <span>Featured Article</span>
                  </label>
                  <p className="text-sm text-slate-500 mt-1 ml-8">
                    Shows prominently on the news page
                  </p>
                </div>
              </div>

              {/* Help Card */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
                <h3 className="font-semibold mb-3">Markdown Tips</h3>
                <div className="text-sm text-slate-400 space-y-2">
                  <p>
                    <code className="bg-slate-700 px-1 rounded">## Heading</code>{" "}
                    for sections
                  </p>
                  <p>
                    <code className="bg-slate-700 px-1 rounded">**bold**</code>{" "}
                    for bold text
                  </p>
                  <p>
                    <code className="bg-slate-700 px-1 rounded">*italic*</code>{" "}
                    for italic text
                  </p>
                  <p>
                    <code className="bg-slate-700 px-1 rounded">- item</code> for
                    bullet lists
                  </p>
                  <p>
                    <code className="bg-slate-700 px-1 rounded">[text](url)</code>{" "}
                    for links
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Image Picker Modal */}
        {showImagePicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h3 className="font-semibold">Select Image</h3>
                <button
                  onClick={() => setShowImagePicker(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {images.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    No images uploaded yet
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((img: any) => (
                      <button
                        key={img.path}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, coverImage: img.path });
                          setShowImagePicker(false);
                        }}
                        className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-red-500 transition-colors"
                      >
                        <img
                          src={img.url || img.path}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


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
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await getArticle(params.slug);
  
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ article });
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
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
    tags,
    featured,
    content,
  } = body;

  // Build markdown content
  const markdown = `---
title: "${title}"
excerpt: "${excerpt}"
category: "${category}"
publishedAt: "${publishedAt}"
coverImage: "${coverImage || ""}"
tags: [${tags.map((t: string) => `"${t}"`).join(", ")}]
author: "Red Flag Security Team"
featured: ${featured || false}
---

${content}
`;

  await saveArticle(params.slug, markdown, `Update article: ${title}`);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteArticle(params.slug);

  return NextResponse.json({ success: true });
}


// ============================================
// FILE: src/app/api/upload/route.ts
// Image Upload API
// ============================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/github";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { filename, content, mimeType } = body;

  // Sanitize filename
  const sanitizedFilename = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");

  // Add timestamp to avoid conflicts
  const timestamp = Date.now();
  const finalFilename = `${timestamp}-${sanitizedFilename}`;

  const path = await uploadImage(finalFilename, content, mimeType);

  return NextResponse.json({ path, filename: finalFilename });
}


// ============================================
// FILE: src/app/api/images/route.ts
// Images List API
// ============================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getImages } from "@/lib/github";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const images = await getImages();
  return NextResponse.json({ images });
}
