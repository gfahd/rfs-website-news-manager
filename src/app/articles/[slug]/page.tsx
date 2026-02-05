"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  X,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export default function EditArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
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
    async function fetchArticle() {
      if (!slug || !session) return;
      try {
        const res = await fetch(`/api/articles/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        const a = data.article;
        if (a) {
          const pub = a.publishedAt
            ? new Date(a.publishedAt).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16);
          setForm({
            title: a.title || "",
            excerpt: a.excerpt || "",
            category: a.category || "company-news",
            publishedAt: pub,
            coverImage: a.coverImage || "",
            tags: Array.isArray(a.tags) ? a.tags.join(", ") : "",
            featured: a.featured || false,
            content: a.content || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch article:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [slug, session]);

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
    if (session) fetchImages();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(slug)}`, {
        method: "PUT",
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
        alert("Failed to update article");
      }
    } catch (error) {
      console.error("Error updating:", error);
      alert("Failed to update article");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/articles");
      } else {
        alert("Failed to delete article");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete article");
    } finally {
      setDeleting(false);
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
          setForm((f) => ({ ...f, coverImage: data.path }));
          setImages((prev) => [...prev, { name: file.name, path: data.path }]);
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

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/articles"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Edit Article</h1>
                <p className="text-slate-400 mt-1">Update your article</p>
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
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-6">
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
              <div>
                <label className="block text-sm font-medium mb-2">Summary</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Brief summary..."
                  required
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cover Image</label>
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
                      <span className="text-sm text-slate-500">Upload image</span>
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
                      <span className="text-sm text-slate-500">Choose existing</span>
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Article Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your article..."
                  required
                  rows={20}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500 font-mono text-sm resize-none"
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                <h3 className="font-semibold mb-4">Settings</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-slate-100"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Publish Date</label>
                  <input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-slate-100"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="security, tips"
                    className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-red-600 focus:ring-red-500 focus:ring-offset-0"
                    />
                    <span>Featured Article</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 w-full justify-center px-4 py-2.5 text-red-400 hover:text-white hover:bg-red-600/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                  {deleting ? "Deleting..." : "Delete Article"}
                </button>
              </div>
            </div>
          </div>
        </form>

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
                  <p className="text-center text-slate-500 py-8">No images uploaded yet</p>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((img: any) => (
                      <button
                        key={img.path}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, coverImage: img.path }));
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
