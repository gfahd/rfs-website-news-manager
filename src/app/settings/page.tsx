"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Settings as SettingsIcon, ExternalLink, BookOpen } from "lucide-react";
import { GEMINI_MODEL_KEY, GEMINI_MODEL_DEFAULT, getStoredGeminiModel } from "@/lib/settings";

const MODEL_OPTIONS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [model, setModel] = useState(GEMINI_MODEL_DEFAULT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setModel(getStoredGeminiModel());
  }, [mounted]);

  const handleModelChange = (value: string) => {
    setModel(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(GEMINI_MODEL_KEY, value);
    }
  };

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-1">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-6 max-w-2xl">
          {/* Gemini model preference */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-2">
              AI (Gemini) model
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Default model used for AI features (article generation, metadata, etc.). Stored in your browser.
            </p>
            <select
              value={model}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full max-w-xs px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-slate-100"
            >
              {MODEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Coming soon */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <SettingsIcon className="w-10 h-10 text-slate-500 mb-3" />
            <p className="text-slate-400">Other settings coming soon.</p>
          </div>

          {/* Info */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">About</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-slate-300">
                <span className="text-slate-500 w-24 shrink-0">Version</span>
                <span>0.1.0</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <span className="text-slate-500 w-24 shrink-0">Repository</span>
                <a
                  href="https://github.com/gfahd/rfs-website"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  GitHub
                  <ExternalLink className="w-4 h-4" />
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <span className="text-slate-500 w-24 shrink-0">Docs</span>
                <a
                  href="https://github.com/gfahd/rfs-website#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  Documentation
                  <BookOpen className="w-4 h-4" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
