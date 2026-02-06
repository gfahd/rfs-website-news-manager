"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  FileText,
  Eye,
  Clock,
  Star,
  Sparkles,
  Image,
  Pencil,
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

function CategoryBadge({ category }: { category: string }) {
  const style =
    CATEGORY_STYLES[category] ?? "bg-slate-500/15 text-slate-400";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {category}
    </span>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-red-500" />
      </div>
    );
  }

  const stats = [
    {
      name: "Total Articles",
      value: articles.length,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/15",
    },
    {
      name: "Published",
      value: articles.filter((a: any) => !a.draft).length,
      icon: Eye,
      color: "text-green-400",
      bg: "bg-green-500/15",
    },
    {
      name: "Drafts",
      value: articles.filter((a: any) => a.draft).length,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/15",
    },
    {
      name: "Featured",
      value: articles.filter((a: any) => a.featured).length,
      icon: Star,
      color: "text-red-400",
      bg: "bg-red-500/15",
    },
  ];

  const firstName = session.user?.name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <main className="ml-64 min-h-screen p-8">
        {/* Header: welcome left, app name right */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-slate-500">{today}</p>
          </div>
          <div className="text-xl font-semibold text-white">
            RFS Content Manager
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500">{stat.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/articles/new"
            className="group flex items-center gap-4 rounded-xl border border-transparent bg-gradient-to-r from-red-600 to-red-500 p-6 shadow-lg shadow-black/20 transition-all duration-200 hover:from-red-500 hover:to-red-600"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">Create with AI</div>
              <div className="text-sm text-white/80">
                Let AI generate a complete article
              </div>
            </div>
          </Link>

          <Link
            href="/media"
            className="group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800">
              <Image className="h-6 w-6 text-slate-400 group-hover:text-slate-300" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">Media Library</div>
              <div className="text-sm text-slate-500">
                Manage images and files
              </div>
            </div>
          </Link>
        </div>

        {/* Recent articles */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between border-b border-slate-800 p-6">
            <h2 className="font-semibold text-white">Recent Articles</h2>
            <Link
              href="/articles"
              className="text-sm text-red-500 transition-colors hover:text-red-400"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-red-500" />
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No articles yet.{" "}
              <Link href="/articles/new" className="text-red-500 hover:underline">
                Create your first one!
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {articles.slice(0, 5).map((article: any) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="group flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-slate-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white">
                      {article.title}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      {article.draft ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                          <Clock className="h-3 w-3" />
                          Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-400">
                          Published
                        </span>
                      )}
                      <CategoryBadge category={article.category} />
                      <span>
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {article.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
                        <Star className="h-3 w-3" />
                        Featured
                      </span>
                    )}
                    <span className="text-slate-500 transition-colors group-hover:text-red-500">
                      <Pencil className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
