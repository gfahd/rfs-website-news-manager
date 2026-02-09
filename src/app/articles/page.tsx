// ============================================
// FILE: src/app/articles/page.tsx
// Articles List Page — draft vs published, filtering, table
// ============================================

"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  FileText,
  Search,
  Trash2,
  Pencil,
  MoreHorizontal,
  X,
  CheckCircle2,
  Plus,
} from "lucide-react";
import Link from "next/link";

const CATEGORY_STYLES: Record<string, string> = {
  "threat-intel": "bg-red-500/15 text-red-400",
  technology: "bg-blue-500/15 text-blue-400",
  "company-news": "bg-slate-500/15 text-slate-400",
  guides: "bg-emerald-500/15 text-emerald-400",
  "security-tips": "bg-amber-500/15 text-amber-400",
  "industry-trends": "bg-violet-500/15 text-violet-400",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "updated", label: "Recently updated" },
  { value: "az", label: "A-Z" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

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

type ArticleItem = {
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  category: string;
  publishedAt: string;
  coverImage?: string;
  tags?: string[];
  author?: string;
  featured?: boolean;
  draft: boolean;
  created_at?: string;
  updated_at?: string;
};

function ArticlesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const initialStatus = searchParams.get("status") || "all";
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">(
    initialStatus === "draft" ? "draft" : initialStatus === "published" ? "published" : "all"
  );
  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeployBanner, setShowDeployBanner] = useState(false);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const loadedOnceRef = useRef(false);

  const PAGE_SIZE = 20;

  // Sync status filter from URL when user navigates (e.g. "View Drafts" link or back button)
  useEffect(() => {
    const s = searchParams.get("status");
    setStatusFilter(s === "draft" ? "draft" : s === "published" ? "published" : "all");
  }, [searchParams]);

  // Sync URL when status filter changes (tab click)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (statusFilter === "all") {
      params.delete("status");
    } else {
      params.set("status", statusFilter);
    }
    const qs = params.toString();
    const newUrl = qs ? `/articles?${qs}` : "/articles";
    if (typeof window !== "undefined" && (window.location.pathname + (window.location.search || "")) !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [statusFilter, router, searchParams]);

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

    if (session && !loadedOnceRef.current) {
      loadedOnceRef.current = true;
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
        setActionsOpen(null);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleting(false);
    }
  };

  const categoriesFromArticles = Array.from(
    new Set(articles.map((a) => a.category).filter(Boolean))
  ).sort();
  const categoryOptions = [{ value: "all", label: "All Categories" }, ...categoriesFromArticles.map((c) => ({ value: c, label: c.replace(/-/g, " ") }))];

  const filteredArticles = articles
    .filter((article) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && !article.draft) ||
        (statusFilter === "draft" && article.draft);
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        article.title.toLowerCase().includes(searchLower) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(searchLower)) ||
        (article.tags && article.tags.some((t: string) => t.toLowerCase().includes(searchLower)));
      const matchesCategory = filterCategory === "all" || article.category === filterCategory;
      return matchesStatus && matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      }
      if (sortBy === "updated") {
        const aUp = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.publishedAt).getTime();
        const bUp = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.publishedAt).getTime();
        return bUp - aUp;
      }
      return (a.title || "").localeCompare(b.title || "");
    });

  const totalFiltered = filteredArticles.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE) || 1;
  const paginatedArticles = filteredArticles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const countAll = articles.length;
  const countPublished = articles.filter((a) => !a.draft).length;
  const countDrafts = articles.filter((a) => a.draft).length;

  const isEmpty = filteredArticles.length === 0;
  const isSearchActive = searchTerm.trim().length > 0;
  const showEmptyAll = !loading && statusFilter === "all" && !isSearchActive && countAll === 0;
  const showEmptyDrafts = !loading && statusFilter === "draft" && !isSearchActive && countDrafts === 0 && countAll > 0;
  const showEmptySearch = !loading && isEmpty && isSearchActive;

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
      <main className="md:ml-64 md:p-8 p-4 pt-16">
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

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-slate-400" />
            <h1 className="text-2xl font-bold text-white">Articles</h1>
          </div>
          <Link
            href="/articles/new"
            className="inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2.5 font-medium transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Article
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Status tabs */}
          <div className="inline-flex rounded-lg bg-slate-800/50 p-0.5">
            <button
              onClick={() => { setStatusFilter("all"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All {loading ? "…" : `(${countAll})`}
            </button>
            <button
              onClick={() => { setStatusFilter("published"); setPage(1); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "published"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
              Published {loading ? "…" : `(${countPublished})`}
            </button>
            <button
              onClick={() => { setStatusFilter("draft"); setPage(1); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "draft"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
              Drafts {loading ? "…" : `(${countDrafts})`}
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
            />
          </div>

          {/* Category dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm py-2 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-red-500/50 min-w-[160px]"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortValue); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm py-2 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-red-500/50 min-w-[160px]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content: table or empty state */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
          </div>
        ) : showEmptyAll ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
            <p className="text-slate-400 mb-4">No articles yet. Create your first article!</p>
            <Link
              href="/articles/new"
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2.5 font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              New Article
            </Link>
          </div>
        ) : showEmptyDrafts ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500/80 mx-auto mb-4" />
            <p className="text-slate-400">No drafts. All articles are published!</p>
          </div>
        ) : showEmptySearch ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
            <Search className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No articles match your search</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-xs uppercase text-slate-500 font-medium tracking-wider border-b border-slate-800">
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Title</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Author</th>
                    <th className="text-right py-3 px-4 w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedArticles.map((article) => (
                    <tr
                      key={article.slug}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition cursor-pointer"
                      onClick={() => router.push(`/articles/${article.slug}`)}
                    >
                      <td className="py-4 px-4">
                        {article.draft ? (
                          <span className="inline-flex items-center gap-2 text-amber-400 text-sm">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-green-400 text-sm">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Published
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{article.title}</span>
                          {article.draft && (
                            <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                              Draft
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <CategoryBadge category={article.category} />
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">
                        {article.draft && article.created_at ? (
                          <span className="text-slate-500">Created: {new Date(article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        ) : (
                          new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">
                        {article.author || "—"}
                      </td>
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setActionsOpen(actionsOpen === article.slug ? null : article.slug)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                            aria-label="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {actionsOpen === article.slug && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActionsOpen(null)}
                                aria-hidden
                              />
                              <div className="absolute right-0 top-full mt-1 z-20 min-w-[120px] rounded-lg bg-slate-800 border border-slate-700 py-1 shadow-xl">
                                <Link
                                  href={`/articles/${article.slug}`}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                                  onClick={() => setActionsOpen(null)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteTarget({ slug: article.slug, title: article.title });
                                    setActionsOpen(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-4">
              {paginatedArticles.map((article) => (
                <div
                  key={article.slug}
                  onClick={() => router.push(`/articles/${article.slug}`)}
                  className="bg-slate-900 rounded-xl border border-slate-800 p-4 cursor-pointer hover:bg-slate-800/30 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{article.title}</span>
                        {article.draft && (
                          <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {article.draft ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-400 text-sm">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-green-400 text-sm">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Published
                          </span>
                        )}
                        <CategoryBadge category={article.category} />
                        <span className="text-sm text-slate-500">
                          {article.draft && article.created_at
                            ? `Created: ${new Date(article.created_at).toLocaleDateString()}`
                            : new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {article.author && (
                        <p className="text-sm text-slate-400 mt-1">{article.author}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/articles/${article.slug}`}
                        className="p-2 text-slate-400 hover:text-white rounded-lg"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ slug: article.slug, title: article.title })}
                        className="p-2 text-slate-400 hover:text-red-400 rounded-lg"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalFiltered > PAGE_SIZE && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered} articles
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-slate-900 rounded-xl border border-slate-700 p-6 mx-4 md:mx-auto max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Delete article?</h3>
            <p className="text-slate-400 text-sm mb-6">
              "{deleteTarget.title}" will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => !deleting && setDeleteTarget(null)}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.slug)}
                disabled={deleting}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
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
