"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  FileText,
  Eye,
  Calendar,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Articles",
      value: articles.length,
      icon: FileText,
      color: "bg-blue-600",
    },
    {
      name: "Published",
      value: articles.filter((a: any) => !a.draft).length,
      icon: Eye,
      color: "bg-green-600",
    },
    {
      name: "Drafts",
      value: articles.filter((a: any) => a.draft).length,
      icon: Calendar,
      color: "bg-yellow-600",
    },
    {
      name: "Featured",
      value: articles.filter((a: any) => a.featured).length,
      icon: TrendingUp,
      color: "bg-red-600",
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {session.user?.name?.split(" ")[0]}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/articles/new"
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-red-500/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                <Plus className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">New Article</div>
                <div className="text-sm text-slate-400">
                  Create a new news article
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
            </div>
          </Link>

          <Link
            href="/media"
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-red-500/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                <Eye className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Media Library</div>
                <div className="text-sm text-slate-400">
                  Manage images and files
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </Link>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold">Recent Articles</h2>
            <Link
              href="/articles"
              className="text-sm text-red-500 hover:text-red-400"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No articles yet.{" "}
              <Link href="/articles/new" className="text-red-500">
                Create your first one!
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {articles.slice(0, 5).map((article: any) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{article.title}</div>
                    <div className="text-sm text-slate-400">
                      {article.category} •{" "}
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                  {article.featured && (
                    <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded">
                      Featured
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
