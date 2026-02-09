// ============================================
// FILE: src/app/articles/new/page.tsx
// AI-Powered New Article Page — Split view editor + Settings & AI sidebar
// ============================================

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Send,
  Save,
  Sparkles,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon,
  X,
  Wand2,
  Loader2,
} from "lucide-react";
import { getStoredGeminiModel, type AIModelOption } from "@/lib/settings";

const FALLBACK_MODEL_OPTIONS: AIModelOption[] = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

const CATEGORIES = [
  { value: "threat-intel", label: "Threat Intelligence" },
  { value: "technology", label: "Technology" },
  { value: "company-news", label: "Company News" },
  { value: "guides", label: "Guides & How-To" },
  { value: "security-tips", label: "Security Tips" },
  { value: "industry-trends", label: "Industry Trends" },
];

const TONES = [
  { value: "Professional", label: "Professional" },
  { value: "Friendly", label: "Friendly" },
  { value: "Technical", label: "Technical" },
  { value: "Persuasive", label: "Persuasive" },
];

const LENGTHS = [
  { value: "short", label: "Short (~400 words)" },
  { value: "medium", label: "Medium (~800 words)" },
  { value: "long", label: "Long (~1200 words)" },
];

export default function NewArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("technology");
  const [tags, setTags] = useState<string[]>([]);
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [featured, setFeatured] = useState(false);
  const [publishedAt, setPublishedAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [model, setModel] = useState("gemini-2.5-flash");
  const [modelOptions, setModelOptions] = useState<AIModelOption[]>(FALLBACK_MODEL_OPTIONS);
  useEffect(() => {
    setModel(getStoredGeminiModel());
  }, []);
  useEffect(() => {
    if (!session) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const list = data.settings?.ai_models;
        if (Array.isArray(list) && list.length > 0) {
          setModelOptions(list.filter((m: { value?: string; label?: string }) => m?.value && m?.label));
          const defaultId = data.settings?.default_model;
          if (defaultId && list.some((m: { value: string }) => m.value === defaultId)) setModel(defaultId);
          else if (!list.some((m: { value: string }) => m.value === model)) setModel(list[0].value);
        }
      })
      .catch(() => {});
  }, [session]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingAction, setGeneratingAction] = useState<string>("");

  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [showURLImport, setShowURLImport] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [images, setImages] = useState<{ name: string; path: string; url?: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // AI Generate panel state
  const [aiTopic, setAITopic] = useState("");
  const [aiTone, setAITone] = useState("Professional");
  const [aiLength, setAILength] = useState<"short" | "medium" | "long">("medium");
  const [urlImportInput, setUrlImportInput] = useState("");
  const [imagePromptResult, setImagePromptResult] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [seoKeywordInput, setSeoKeywordInput] = useState("");

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
    if (session) fetchImages();
  }, [session]);

  const showError = useCallback((message: string) => {
    setErrorToast(message);
    setTimeout(() => setErrorToast(null), 5000);
  }, []);

  async function callAI(action: string, payload: Record<string, unknown>) {
    setIsGenerating(true);
    setGeneratingAction(action);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, model, payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "AI request failed";
      showError(msg);
      throw error;
    } finally {
      setIsGenerating(false);
      setGeneratingAction("");
    }
  }

  const handleAIGenerateArticle = async () => {
    if (!aiTopic.trim()) {
      showError("Please enter a topic.");
      return;
    }
    try {
      const data = await callAI("generate_article", {
        topic: aiTopic.trim(),
        tone: aiTone,
        length: aiLength,
      });
      if (data?.content) {
        setContent(data.content);
        setShowAIGenerate(false);
        setAITopic("");
        try {
          const meta = await callAI("generate_metadata", {
            content: data.content,
          });
          if (meta?.title) setTitle(meta.title);
          if (meta?.excerpt) setExcerpt(meta.excerpt);
          if (meta?.category) setCategory(meta.category);
          if (Array.isArray(meta?.tags)) setTags(meta.tags);
          if (Array.isArray(meta?.seoKeywords)) setSeoKeywords(meta.seoKeywords);
        } catch {
          // metadata optional
        }
      }
    } catch {
      // error already shown
    }
  };

  const handleURLImport = async () => {
    const url = urlImportInput.trim();
    if (!url) {
      showError("Please enter a URL.");
      return;
    }
    try {
      const data = await callAI("extract_from_url", { url });
      if (data?.content) setContent(data.content);
      if (data?.title) setTitle(data.title);
      if (data?.excerpt) setExcerpt(data.excerpt);
      if (data?.category) setCategory(data.category);
      if (Array.isArray(data?.tags)) setTags(data.tags);
      if (Array.isArray(data?.seoKeywords)) setSeoKeywords(data.seoKeywords);
      setShowURLImport(false);
      setUrlImportInput("");
    } catch {
      // error already shown
    }
  };

  const handleImproveTitle = async () => {
    if (!title.trim()) return;
    try {
      const data = await callAI("improve_text", { text: title });
      if (data?.text) setTitle(data.text);
    } catch {}
  };

  const handleImproveExcerpt = async () => {
    if (!excerpt.trim()) return;
    try {
      const data = await callAI("improve_text", { text: excerpt });
      if (data?.text) setExcerpt(data.text);
    } catch {}
  };

  const handleGenerateExcerpt = async () => {
    if (!content.trim()) {
      showError("Add some content first to generate an excerpt.");
      return;
    }
    try {
      const data = await callAI("generate_metadata", { content });
      if (data?.excerpt) setExcerpt(data.excerpt);
    } catch {}
  };

  const handleAIImprove = async () => {
    if (!content.trim()) return;
    const instruction =
      "Improve the formatting, structure, grammar, and readability of this article. Add proper markdown headings, bold important terms, and ensure good paragraph flow. Return the improved markdown.";
    try {
      const data = await callAI("improve_text", { text: content, instruction });
      if (data?.text) setContent(data.text);
    } catch {}
  };

  const handleAIFormat = async () => {
    if (!content.trim()) return;
    const instruction =
      "Add proper markdown formatting to this text: ## for section headings, **bold** for key terms, proper paragraph breaks, and bullet points where appropriate. Do not change the content meaning. Return formatted markdown only.";
    try {
      const data = await callAI("improve_text", { text: content, instruction });
      if (data?.text) setContent(data.text);
    } catch {}
  };

  const handleGenerateAllMetadata = async () => {
    if (!content.trim()) {
      showError("Add some content first.");
      return;
    }
    try {
      const data = await callAI("generate_metadata", { content, title: title || undefined });
      if (data?.title) setTitle(data.title);
      if (data?.excerpt) setExcerpt(data.excerpt);
      if (data?.category) setCategory(data.category);
      if (Array.isArray(data?.tags)) setTags(data.tags);
      if (Array.isArray(data?.seoKeywords)) setSeoKeywords(data.seoKeywords);
    } catch {}
  };

  const handleImagePrompt = async () => {
    try {
      const data = await callAI("generate_image_prompt", {
        title: title || "Untitled",
        content: content.slice(0, 2000),
      });
      setImagePromptResult(data?.prompt ?? null);
    } catch {}
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
          setCoverImage(data.path);
          setImages((prev) => [...prev, { name: file.name, path: data.path }]);
        } else throw new Error("No path returned");
      } catch (error) {
        showError("Failed to upload image");
      }
    };
    reader.readAsDataURL(file);
  };

  const addTagsFromInput = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    clearInput: () => void
  ) => {
    const trimmed = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (trimmed.length) {
      setter((prev) => [...new Set([...prev, ...trimmed])]);
      clearInput();
    }
  };

  const removeTag = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const buildPayload = () => ({
    title: title || "Untitled",
    excerpt,
    content,
    category,
    publishedAt: new Date(publishedAt).toISOString(),
    coverImage,
    tags,
    seoKeywords,
    featured,
  });

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), draft: false }),
      });
      if (res.ok) {
        router.push("/articles?deploy=1");
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Failed to save article");
      }
    } catch (error) {
      showError("Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showError("Enter a title to save as draft");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), draft: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.slug) {
        router.push(`/articles/${data.slug}`);
      } else {
        showError(data.error || "Failed to save draft");
      }
    } catch (error) {
      showError("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = content.length;

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-600 border-t-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 p-6 lg:p-8 transition-all duration-200">
        {/* Error toast */}
        {errorToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 bg-red-500/95 text-white rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200">
            <span>{errorToast}</span>
            <button
              type="button"
              onClick={() => setErrorToast(null)}
              className="p-1 hover:bg-red-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handlePublish}>
          {/* Top toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/articles"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">New Article</h1>
                <p className="text-slate-400 text-sm mt-0.5">AI-powered article creation</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Model selector with sparkle */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
                <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={modelOptions.some((o) => o.value === model) ? model : modelOptions[0]?.value ?? model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-transparent text-slate-200 text-sm focus:outline-none border-none py-1 pr-1 cursor-pointer"
                >
                  {modelOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowAIGenerate(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all duration-200 shadow-lg shadow-red-500/20"
              >
                <Sparkles className="w-4 h-4" />
                AI Generate
              </button>
              <button
                type="button"
                onClick={() => setShowURLImport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
              >
                <LinkIcon className="w-4 h-4" />
                Import from URL
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save as draft"}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-all duration-200"
              >
                <Send className="w-4 h-4" />
                {saving ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[65%_35%] gap-8">
            {/* Left column — Editor */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Article title..."
                    required
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500 text-lg transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={handleImproveTitle}
                    disabled={!title.trim() || isGenerating}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all duration-200 disabled:opacity-50"
                    title="AI Fix title"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span className="text-sm">AI Fix</span>
                  </button>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Excerpt / Summary
                </label>
                <div className="flex gap-2 items-start">
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Brief summary of the article..."
                    required
                    rows={3}
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500 resize-none transition-all duration-200"
                  />
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={handleImproveExcerpt}
                      disabled={!excerpt.trim() || isGenerating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all duration-200 disabled:opacity-50 text-sm"
                      title="AI Fix excerpt"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      AI Fix
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateExcerpt}
                      disabled={!content.trim() || isGenerating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/50 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all duration-200 disabled:opacity-50 text-sm"
                      title="Generate excerpt from content"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* Content editor */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Article Content (Markdown)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write or paste content here. Use ## for headings, **bold**, etc."
                  required
                  className="w-full min-h-[500px] px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500 font-mono text-sm resize-y transition-all duration-200"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAIImprove}
                      disabled={!content.trim() || isGenerating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all duration-200 disabled:opacity-50 text-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Improve
                    </button>
                    <button
                      type="button"
                      onClick={handleAIFormat}
                      disabled={!content.trim() || isGenerating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all duration-200 disabled:opacity-50 text-sm"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      AI Format
                    </button>
                  </div>
                  <span className="text-slate-500 text-sm font-mono">
                    {charCount} chars · {wordCount} words
                  </span>
                </div>
              </div>

              {/* Cover image */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cover Image
                </label>
                {coverImage ? (
                  <div className="relative aspect-[2/1] rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                    <img
                      src={coverImage.startsWith("/images/news/") ? `/api/serve-image?path=${encodeURIComponent(coverImage)}` : coverImage}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/90 hover:bg-red-600 rounded-lg transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 mt-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 cursor-pointer transition-all duration-200">
                    <Upload className="w-4 h-4" />
                    Upload Image
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all duration-200"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Choose from Library
                  </button>
                  <button
                    type="button"
                    onClick={handleImagePrompt}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all duration-200 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Suggest
                  </button>
                  {coverImage && (
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      className="inline-flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
                {imagePromptResult && (
                  <div className="mt-2 p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300">
                    <p className="font-medium text-slate-200 mb-1">Suggested image prompt</p>
                    <p className="whitespace-pre-wrap">{imagePromptResult}</p>
                    <button
                      type="button"
                      onClick={() => setImagePromptResult(null)}
                      className="mt-2 text-slate-500 hover:text-white text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right column — Settings & AI (sticky) */}
            <div className="lg:sticky lg:top-6 space-y-6 self-start">
              {/* Settings card */}
              <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 transition-all duration-200">
                <h3 className="font-semibold text-white mb-4">Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Category
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 text-sm"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleGenerateAllMetadata}
                        disabled={!content.trim() || isGenerating}
                        className="px-2.5 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all duration-200 disabled:opacity-50"
                        title="AI Suggest category"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Publish Date
                    </label>
                    <input
                      type="date"
                      value={publishedAt}
                      onChange={(e) => setPublishedAt(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add tag, comma separated"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 text-sm placeholder:text-slate-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTagsFromInput(tagInput, setTags, () => setTagInput(""));
                          }
                        }}
                        onBlur={() => addTagsFromInput(tagInput, setTags, () => setTagInput(""))}
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAllMetadata}
                        disabled={!content.trim() || isGenerating}
                        className="px-2.5 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all duration-200 disabled:opacity-50"
                        title="AI Suggest tags"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t, i) => (
                        <span
                          key={`${t}-${i}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-md text-sm text-slate-200"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => removeTag(i, setTags)}
                            className="hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      SEO Keywords
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={seoKeywordInput}
                        onChange={(e) => setSeoKeywordInput(e.target.value)}
                        placeholder="Add keyword, comma separated"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 text-sm placeholder:text-slate-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTagsFromInput(seoKeywordInput, setSeoKeywords, () =>
                              setSeoKeywordInput("")
                            );
                          }
                        }}
                        onBlur={() =>
                          addTagsFromInput(seoKeywordInput, setSeoKeywords, () =>
                            setSeoKeywordInput("")
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAllMetadata}
                        disabled={!content.trim() || isGenerating}
                        className="px-2.5 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all duration-200 disabled:opacity-50"
                        title="AI Suggest keywords"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {seoKeywords.map((k, i) => (
                        <span
                          key={`${k}-${i}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-md text-sm text-slate-200"
                        >
                          {k}
                          <button
                            type="button"
                            onClick={() => removeTag(i, setSeoKeywords)}
                            className="hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Featured</label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={featured}
                      onClick={() => setFeatured((f) => !f)}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                        featured ? "bg-red-500" : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          featured ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Author</label>
                    <p className="text-slate-400 text-sm">Red Flag Security Team</p>
                  </div>
                </div>
              </div>

              {/* AI Assistant card */}
              <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 transition-all duration-200">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Assistant
                </h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowAIGenerate(true)}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500/20 to-purple-500/20 border border-red-500/30 text-red-300 hover:from-red-500/30 hover:to-purple-500/30 transition-all duration-200 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Full Article
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateAllMetadata}
                    disabled={!content.trim() || isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 transition-all duration-200 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate All Metadata
                  </button>
                  <button
                    type="button"
                    onClick={handleAIImprove}
                    disabled={!content.trim() || isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 transition-all duration-200 disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4" />
                    Improve Article
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowURLImport(true)}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 transition-all duration-200 disabled:opacity-50"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Import from URL
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <label className="block text-xs text-slate-500 mb-1">Gemini model</label>
                  <select
                    value={modelOptions.some((o) => o.value === model) ? model : modelOptions[0]?.value ?? model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-red-500"
                  >
                    {modelOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* AI Generate modal */}
        {showAIGenerate && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-all duration-200"
            onClick={() => !isGenerating && setShowAIGenerate(false)}
          >
            <div
              className="bg-slate-900 rounded-xl border border-slate-700 max-w-lg w-full p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-400" />
                AI Generate Article
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    What should the article be about?
                  </label>
                  <textarea
                    value={aiTopic}
                    onChange={(e) => setAITopic(e.target.value)}
                    placeholder="e.g., Benefits of modern CCTV systems for retail stores"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setAITone(t.value)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                          aiTone === t.value
                            ? "bg-red-500 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Length</label>
                  <div className="flex flex-wrap gap-2">
                    {LENGTHS.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setAILength(l.value as "short" | "medium" | "long")}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                          aiLength === l.value
                            ? "bg-red-500 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                {isGenerating && generatingAction === "generate_article" ? (
                  <div className="flex items-center gap-3 py-4 text-slate-300">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI is writing your article...</span>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAIGenerate(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAIGenerateArticle}
                      disabled={!aiTopic.trim()}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      Generate Article
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* URL Import modal */}
        {showURLImport && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-all duration-200"
            onClick={() => !isGenerating && setShowURLImport(false)}
          >
            <div
              className="bg-slate-900 rounded-xl border border-slate-700 max-w-lg w-full p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-red-400" />
                Import from URL
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">URL</label>
                  <input
                    type="url"
                    value={urlImportInput}
                    onChange={(e) => setUrlImportInput(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                {isGenerating && generatingAction === "extract_from_url" ? (
                  <div className="flex items-center gap-3 py-4 text-slate-300">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI is analyzing the URL and creating your article...</span>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowURLImport(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleURLImport}
                      disabled={!urlImportInput.trim()}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      Import & Generate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image picker modal */}
        {showImagePicker && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-all duration-200"
            onClick={() => setShowImagePicker(false)}
          >
            <div
              className="bg-slate-900 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white">Select Image</h3>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(false)}
                  className="p-1 text-slate-400 hover:text-white rounded transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {images.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No images uploaded yet</p>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((img) => (
                      <button
                        key={img.path}
                        type="button"
                        onClick={() => {
                          setCoverImage(img.path);
                          setShowImagePicker(false);
                        }}
                        className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-red-500 transition-all duration-200"
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
