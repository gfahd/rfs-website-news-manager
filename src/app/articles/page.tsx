// ============================================
// FILE: src/app/articles/page.tsx
// Articles List Page
// ============================================

"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Plus, Search, Trash2, Star, Clock, Eye, X } from "lucide-react";
import Link from "next/link";

const CATEGORY_PILLS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "threat-intel", label: "Threat Intel" },
  { value: "technology", label: "Technology" },
  { value: "company-news", label: "Company News" },
  { value: "guides", label: "Guides" },
  { value: "security-tips", label: "Security Tips" },
  { value: "industry-trends", label: "Industry Trends" },
];

const CATEGORY_STYLES: Record<string, string> = {
  "threat-intel": "bg-red-500/15 text-red-400",
  technology: "bg-blue-500/15 text-blue-400",
  "company-news": "bg-slate-500/15 text-slate-400",
  guides: "bg-emerald-500/15 text-emerald-400",
  "security-tips": "bg-amber-500/15 text-amber-400",
  "industry-trends": "bg-violet-500/15 text-violet-400",
};

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category] ?? "bg-slate-500/15 text-slate-400";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {category.replace(/-/g, " ")}
    </span>
  );
}

function ArticlesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeployBanner, setShowDeployBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get("deploy") === "1") {
      setShowDeployBanner(true);
      router.replace("/articles", { scroll: false });
    }
  }, [searchParams, router]);

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
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${slug}`, { method: "DELETE" });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.slug !== slug));
        setDeleteTarget(null);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleting(false);
    }
  };

  const filteredArticles = articles
    .filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        filterCategory === "all" || article.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 p-6 md:p-8">
        {/* Deploy reminder banner */}
        {showDeployBanner && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
            <div className="flex-1 min-w-0">
              <p className="font-medium">Article saved to the database.</p>
              <p className="mt-1 text-sm text-amber-200/90">
                It’s stored in Supabase. If your live site reads from the same database, it may update automatically; otherwise a rebuild may be needed depending on your setup.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeployBanner(false)}
              className="shrink-0 rounded p-1 text-amber-300 hover:bg-amber-500/20 hover:text-amber-100"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Articles</h1>
            <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-slate-800 text-slate-300 text-sm font-medium">
              {loading ? "…" : filteredArticles.length}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 sm:min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-slate-100 placeholder:text-slate-500 transition-all"
              />
            </div>
            <Link
              href="/articles/new"
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2.5 font-medium transition-colors shrink-0"
            >
              <Plus className="w-5 h-5" />
              New Article
            </Link>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORY_PILLS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filterCategory === cat.value
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Articles list - card based */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
            <p className="text-slate-400 mb-4">
              No articles yet. Create your first article with AI!
            </p>
            <Link
              href="/articles/new"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2.5 font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Article
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <article
                key={article.slug}
                className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="font-semibold text-white hover:text-red-400 transition-colors block truncate"
                  >
                    {article.title}
                  </Link>
                  {article.excerpt && (
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(article.tags || []).slice(0, 4).map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex rounded-md px-2 py-0.5 text-xs bg-slate-800 text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                  {article.draft ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                      <Clock className="h-3.5 w-3.5" />
                      Draft
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-400" title="Published">
                      <Eye className="h-3.5 w-3.5" />
                      Published
                    </span>
                  )}
                  <CategoryBadge category={article.category} />
                  <span className="text-sm text-slate-500">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                  {article.featured && (
                    <span title="Featured">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    </span>
                  )}
                  <button
                    onClick={() =>
                      setDeleteTarget({ slug: article.slug, title: article.title })
                    }
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete article?
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              “{deleteTarget.title}” will be permanently deleted. This cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => !deleting && setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.slug)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
        </div>
      }
    >
      <ArticlesPageContent />
    </Suspense>
  );
}
