"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  FileText,
  CheckCircle2,
  PenLine,
  Tag,
  Sparkles,
  Image,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

type ArticleItem = {
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  draft: boolean;
  author?: string;
  created_at?: string;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedOnceRef = useRef(false);

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

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-red-500" />
      </div>
    );
  }

  const countPublished = articles.filter((a: ArticleItem) => !a.draft).length;
  const countDrafts = articles.filter((a: ArticleItem) => a.draft).length;
  const categories = Array.from(new Set(articles.map((a: ArticleItem) => a.category).filter(Boolean)));

  const stats = [
    {
      name: "Total Articles",
      value: articles.length,
      icon: FileText,
      color: "text-slate-300",
      bg: "bg-slate-500/15",
    },
    {
      name: "Published",
      value: countPublished,
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-500/15",
    },
    {
      name: "Drafts",
      value: countDrafts,
      icon: PenLine,
      color: "text-amber-400",
      bg: "bg-amber-500/15",
    },
    {
      name: "Categories",
      value: categories.length,
      icon: Tag,
      color: "text-violet-400",
      bg: "bg-violet-500/15",
    },
  ];

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const recentArticles = [...articles]
    .sort((a, b) => {
      const aDate = a.draft && a.created_at ? new Date(a.created_at).getTime() : new Date(a.publishedAt).getTime();
      const bDate = b.draft && b.created_at ? new Date(b.created_at).getTime() : new Date(b.publishedAt).getTime();
      return bDate - aDate;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <main className="md:ml-64 min-h-screen p-4 pt-16 md:p-8">
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

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-3xl font-bold text-white">
                    {loading ? "…" : stat.value}
                  </div>
                  <div className="text-sm text-slate-400">{stat.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Draft articles alert */}
        {!loading && countDrafts > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <span className="text-amber-200 font-medium">
                You have {countDrafts} unpublished draft{countDrafts !== 1 ? "s" : ""}
              </span>
            </div>
            <Link
              href="/articles?status=draft"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/30 transition-colors"
            >
              View Drafts
            </Link>
          </div>
        )}

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
        <div className="rounded-xl border border-slate-800 bg-slate-900">
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
              {recentArticles.map((article: ArticleItem) => (
                <div
                  key={article.slug}
                  className="group flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-slate-800/50"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {article.draft ? (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    ) : (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-white">
                        {article.title}
                        {article.draft && (
                          <span className="ml-2 text-xs font-normal text-amber-400">Draft</span>
                        )}
                      </div>
                      <div className="mt-0.5 text-sm text-slate-500">
                        {article.draft && article.created_at
                          ? `Created: ${new Date(article.created_at).toLocaleDateString()}`
                          : new Date(article.publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-red-500"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
