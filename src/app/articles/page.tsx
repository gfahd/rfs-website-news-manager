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
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 p-8">
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