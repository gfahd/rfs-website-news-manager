// ============================================
// FILE: src/app/articles/new/page.tsx
// New Article — Three-zone layout: Toolbar, Editor, Settings
// ============================================

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  X,
  Sparkles,
  Wand2,
  Loader2,
  TrendingUp,
  RefreshCw,
  Flame,
  Type,
  FileText,
  Image as ImageIcon,
  Sparkles as SparklesIcon,
  Monitor,
  Grid,
  Search,
  Check,
} from "lucide-react";
import { getStoredGeminiModel, getAiModelsCache, type AIModelOption } from "@/lib/settings-client";
import { useError } from "@/context/ErrorContext";
import { ArticlePreview } from "@/components/articles/ArticlePreview";
import { AIImageGenerator } from "@/components/articles/AIImageGenerator";
import { EditorToolbar, type ArticleStatus } from "@/components/articles/EditorToolbar";
import { CollapsibleSection } from "@/components/articles/CollapsibleSection";
import { ContentEditor } from "@/components/articles/ContentEditor";
import { CoverImagePicker } from "@/components/articles/CoverImagePicker";
import { AIToolsPanel } from "@/components/articles/AIToolsPanel";
import { ArticleSettings, type CategoryOption } from "@/components/articles/ArticleSettings";

const FALLBACK_MODEL_OPTIONS: AIModelOption[] = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

const FALLBACK_CATEGORIES: CategoryOption[] = [
  { value: "threat-intel", label: "Threat Intelligence" },
  { value: "technology", label: "Technology" },
  { value: "company-news", label: "Company News" },
  { value: "guides", label: "Guides & How-To" },
  { value: "security-tips", label: "Security Tips" },
  { value: "industry-trends", label: "Industry Trends" },
];

const DEFAULT_DISCOVERY_CATEGORIES = [
  "Residential Security",
  "Commercial Security",
  "Alarm Systems",
  "Access Control",
  "CCTV & Surveillance",
  "Intercom Systems",
  "Smart Wiring",
  "Video Doorbell",
  "Medical Safety",
  "Home Automation",
  "Fire & Life Safety",
  "Cybersecurity",
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

type TrendingTopic = {
  title: string;
  description: string;
  why_trending: string;
  category: string;
  interest: string;
  source?: string;
};

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
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().split("T")[0]);
  const [author, setAuthor] = useState("Red Flag Security Team");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [modelOptions, setModelOptions] = useState<AIModelOption[]>(FALLBACK_MODEL_OPTIONS);
  const [categories, setCategories] = useState<CategoryOption[]>(FALLBACK_CATEGORIES);

  const settingsLoadedRef = useRef(false);
  const imagesLoadedRef = useRef(false);
  const [sectionOpen, setSectionOpen] = useState({ title: true, content: true, cover: true, ai: true });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingAction, setGeneratingAction] = useState<string>("");
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [showURLImport, setShowURLImport] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showAIImageGenerator, setShowAIImageGenerator] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [images, setImages] = useState<{ name: string; path: string; url?: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { showError } = useError();

  const [aiTopic, setAITopic] = useState("");
  const [aiTone, setAITone] = useState("Professional");
  const [aiLength, setAILength] = useState<"short" | "medium" | "long">("medium");
  const [urlImportInput, setUrlImportInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [seoKeywordInput, setSeoKeywordInput] = useState("");

  const [showDiscoverTopics, setShowDiscoverTopics] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [trendingTopicsLoading, setTrendingTopicsLoading] = useState(false);
  const [discoveryScreen, setDiscoveryScreen] = useState<"setup" | "results">("setup");
  const [discoveryCategories, setDiscoveryCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [discoveryKeyword, setDiscoveryKeyword] = useState("");
  const [discoverySearchContext, setDiscoverySearchContext] = useState("");
  const [lastDiscoveryPayload, setLastDiscoveryPayload] = useState<{ mode: "auto" | "categories" | "keyword"; categories?: string[]; keyword?: string } | null>(null);

  useEffect(() => {
    setModel(getStoredGeminiModel());
  }, []);

  useEffect(() => {
    if (!session || settingsLoadedRef.current) return;
    settingsLoadedRef.current = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings || {};
        if (s.default_author) setAuthor(s.default_author);
        const catList = Array.isArray(s.categories) ? s.categories : [];
        if (catList.length > 0) {
          setCategories(
            catList.map((c: string) => ({ value: c, label: c }))
          );
          if (!catList.includes(category)) setCategory(catList[0]);
        }
        let list = Array.isArray(s.ai_models)
          ? s.ai_models.filter((m: { value?: string; label?: string }) => m?.value && m?.label)
          : [];
        if (list.length <= 2) {
          const cache = getAiModelsCache();
          if (cache?.ai_models?.length) {
            list = cache.ai_models;
            const defaultId = cache.default_model && list.some((m: { value: string }) => m.value === cache.default_model) ? cache.default_model : list[0]?.value;
            setModelOptions(list);
            if (defaultId) setModel(defaultId);
            return;
          }
        }
        if (list.length > 0) {
          setModelOptions(list);
          const defaultId = s.default_model;
          if (defaultId && list.some((m: { value: string }) => m.value === defaultId)) setModel(defaultId);
          else if (!list.some((m: { value: string }) => m.value === model)) setModel(list[0].value);
        }
      })
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch("/api/images");
        const data = await res.json();
        setImages(data.images || []);
      } catch {
        // ignore
      }
    }
    if (session && !imagesLoadedRef.current) {
      imagesLoadedRef.current = true;
      fetchImages();
    }
  }, [session]);


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
      showError(error instanceof Error ? error.message : "AI request failed");
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
          const meta = await callAI("generate_metadata", { content: data.content });
          if (meta?.title) setTitle(meta.title);
          if (meta?.excerpt) setExcerpt(meta.excerpt);
          if (meta?.category) setCategory(meta.category);
          if (Array.isArray(meta?.tags)) setTags(meta.tags);
          if (Array.isArray(meta?.seoKeywords)) setSeoKeywords(meta.seoKeywords);
        } catch {
          // optional
        }
      }
    } catch {
      // handled
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
      // handled
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
    setIsGenerating(true);
    setGeneratingAction("improve");
    try {
      const data = await callAI("improve_text", {
        text: content,
        instruction:
          "Improve the formatting, structure, grammar, and readability of this article. Add proper markdown headings, bold important terms, and ensure good paragraph flow. Return the improved markdown.",
      });
      if (data?.text) setContent(data.text);
    } catch {
      // handled
    } finally {
      setGeneratingAction("");
      setIsGenerating(false);
    }
  };

  const handleAIFormat = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    setGeneratingAction("format");
    try {
      const data = await callAI("improve_text", {
        text: content,
        instruction:
          "Add proper markdown formatting to this text: ## for section headings, **bold** for key terms, proper paragraph breaks, and bullet points where appropriate. Do not change the content meaning. Return formatted markdown only.",
      });
      if (data?.text) setContent(data.text);
    } catch {
      // handled
    } finally {
      setGeneratingAction("");
      setIsGenerating(false);
    }
  };

  const handleGenerateAllMetadata = async () => {
    if (!content.trim()) {
      showError("Add some content first.");
      return;
    }
    setGeneratingAction("generate_metadata");
    try {
      const data = await callAI("generate_metadata", { content, title: title || undefined });
      if (data?.title) setTitle(data.title);
      if (data?.excerpt) setExcerpt(data.excerpt);
      if (data?.category) setCategory(data.category);
      if (Array.isArray(data?.tags)) setTags(data.tags);
      if (Array.isArray(data?.seoKeywords)) setSeoKeywords(data.seoKeywords);
    } catch {
      // handled
    } finally {
      setGeneratingAction("");
    }
  };

  const handleWriteFromTopic = async (topic: TrendingTopic) => {
    setShowDiscoverTopics(false);
    try {
      const data = await callAI("generate_from_topic", {
        title: topic.title,
        description: topic.description,
        category: topic.category,
      });
      if (data?.content) {
        setContent(data.content);
        try {
          const meta = await callAI("generate_metadata", { content: data.content });
          if (meta?.title) setTitle(meta.title);
          if (meta?.excerpt) setExcerpt(meta.excerpt);
          if (meta?.category) setCategory(meta.category);
          if (Array.isArray(meta?.tags)) setTags(meta.tags);
          if (Array.isArray(meta?.seoKeywords)) setSeoKeywords(meta.seoKeywords);
        } catch {}
      }
    } catch {
      // handled
    }
  };

  async function runDiscovery(payload: { mode: "auto" | "categories" | "keyword"; categories?: string[]; keyword?: string }) {
    setLastDiscoveryPayload(payload);
    if (payload.mode === "auto") {
      setDiscoverySearchContext("Auto-discovery across all categories");
    } else if (payload.mode === "categories" && payload.categories?.length) {
      setDiscoverySearchContext(`Based on: ${payload.categories.join(", ")}`);
    } else if (payload.mode === "keyword" && payload.keyword) {
      setDiscoverySearchContext(`Based on: ${payload.keyword}`);
    }
    setDiscoveryScreen("results");
    setTrendingTopicsLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discover_topics", model, payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch topics");
      setTrendingTopics(Array.isArray(data?.topics) ? data.topics : []);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to fetch topics");
      setTrendingTopics([]);
    } finally {
      setTrendingTopicsLoading(false);
    }
  }

  function fetchTrendingTopics() {
    if (lastDiscoveryPayload) runDiscovery(lastDiscoveryPayload);
  }

  useEffect(() => {
    if (showDiscoverTopics) {
      setDiscoveryScreen("setup");
      setSelectedCategories([]);
      setDiscoveryKeyword("");
      setDiscoverySearchContext("");
      setLastDiscoveryPayload(null);
      setTrendingTopics([]);
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => {
          const cats = data.settings?.discovery_categories;
          setDiscoveryCategories(Array.isArray(cats) && cats.length > 0 ? cats : DEFAULT_DISCOVERY_CATEGORIES);
        })
        .catch(() => setDiscoveryCategories(DEFAULT_DISCOVERY_CATEGORIES));
    }
  }, [showDiscoverTopics]);

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
    author,
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
    } catch {
      showError("Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      showError("Enter a title to save as draft");
      return;
    }
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), draft: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.slug) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        router.push(`/articles/${data.slug}`);
      } else {
        showError(data.error || "Failed to save draft");
      }
    } catch {
      showError("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcuts: Ctrl+S save draft, Ctrl+Enter publish
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDraft(e as unknown as React.MouseEvent);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        const form = document.querySelector("form");
        if (form) form.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSaveDraft]);

  const articleStatus: ArticleStatus = "unsaved";

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
      <main className="md:ml-64 md:p-8 p-4 pt-16 transition-all duration-200">
        <form onSubmit={handlePublish} className="space-y-6">
          <EditorToolbar
            title="New Article"
            isEditPage={false}
            status={articleStatus}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            model={model}
            modelOptions={modelOptions}
            onModelChange={setModel}
            onSaveDraft={handleSaveDraft}
            saving={saving}
            saveSuccess={saveSuccess}
          />

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Zone 2: Main Editor (~65%) */}
            <div className="w-full lg:w-[65%] space-y-4">
              {viewMode === "preview" ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-slate-500">
                    <Monitor className="w-3.5 h-3.5" />
                    Website Preview
                  </div>
                  <div className="min-h-[500px] rounded-xl overflow-auto bg-white border border-slate-200 p-6">
                    <ArticlePreview
                      title={title}
                      excerpt={excerpt}
                      content={content}
                      coverImage={coverImage}
                      category={category}
                      tags={tags}
                      author={author}
                      publishedAt={publishedAt}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {isGenerating && generatingAction === "generate_from_topic" && (
                    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI is writing your article...
                    </div>
                  )}

                  <CollapsibleSection
                    title="Title & Summary"
                    icon={<Type className="w-4 h-4" />}
                    open={sectionOpen.title}
                    onToggle={() => setSectionOpen((s) => ({ ...s, title: !s.title }))}
                  >
                    <div className="space-y-4">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Article title..."
                          required
                          className="flex-1 text-xl font-semibold bg-transparent border-b border-slate-700 focus:outline-none focus:border-red-500 text-white placeholder:text-slate-500 py-2 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={handleImproveTitle}
                          disabled={!title.trim() || isGenerating}
                          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700 text-xs transition-all duration-200 disabled:opacity-50"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          AI Fix
                        </button>
                      </div>
                      <div>
                        <textarea
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                          placeholder="Brief summary..."
                          required
                          rows={2}
                          className="w-full px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-400 text-sm resize-none transition-all duration-200"
                        />
                        <div className="flex gap-2 mt-1.5">
                          <button
                            type="button"
                            onClick={handleImproveExcerpt}
                            disabled={!excerpt.trim() || isGenerating}
                            className="flex items-center gap-1 px-2 py-1 rounded border border-slate-600 bg-slate-800/50 text-slate-300 text-xs hover:bg-slate-700 transition-all duration-200 disabled:opacity-50"
                          >
                            <Wand2 className="w-3 h-3" />
                            AI Fix
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerateExcerpt}
                            disabled={!content.trim() || isGenerating}
                            className="flex items-center gap-1 px-2 py-1 rounded border border-slate-600 bg-slate-800/50 text-slate-300 text-xs hover:bg-slate-700 transition-all duration-200 disabled:opacity-50"
                          >
                            <Sparkles className="w-3 h-3" />
                            AI Generate
                          </button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Article Content"
                    icon={<FileText className="w-4 h-4" />}
                    open={sectionOpen.content}
                    onToggle={() => setSectionOpen((s) => ({ ...s, content: !s.content }))}
                  >
                    <ContentEditor
                      value={content}
                      onChange={setContent}
                      onAIImprove={handleAIImprove}
                      onAIFormat={handleAIFormat}
                      isGenerating={isGenerating}
                      generatingAction={generatingAction}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Cover Image"
                    icon={<ImageIcon className="w-4 h-4" />}
                    open={sectionOpen.cover}
                    onToggle={() => setSectionOpen((s) => ({ ...s, cover: !s.cover }))}
                  >
                    <CoverImagePicker
                      coverImage={coverImage}
                      onCoverImageChange={setCoverImage}
                      onLibraryClick={() => setShowImagePicker(true)}
                      onAIGenerateClick={() => setShowAIImageGenerator(true)}
                      onUploadComplete={(path, name) =>
                        setImages((prev) => [...prev, { name, path }])
                      }
                      onUploadError={() => showError("Failed to upload image")}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="AI Tools"
                    icon={<SparklesIcon className="w-4 h-4" />}
                    open={sectionOpen.ai}
                    onToggle={() => setSectionOpen((s) => ({ ...s, ai: !s.ai }))}
                  >
                    <AIToolsPanel
                      onGenerateFullArticle={() => setShowAIGenerate(true)}
                      onDiscoverTopics={() => setShowDiscoverTopics(true)}
                      onImportFromURL={() => setShowURLImport(true)}
                      onGenerateMetadata={handleGenerateAllMetadata}
                      isGenerating={isGenerating}
                      generatingAction={generatingAction}
                    />
                  </CollapsibleSection>
                </>
              )}
            </div>

            {/* Zone 3: Settings Sidebar (~35%) */}
            <div className="w-full lg:w-[35%] lg:sticky lg:top-24 self-start space-y-6">
              <ArticleSettings
                categories={categories}
                category={category}
                onCategoryChange={setCategory}
                onCategoryAISuggest={handleGenerateAllMetadata}
                publishedAt={publishedAt}
                onPublishedAtChange={setPublishedAt}
                tags={tags}
                tagInput={tagInput}
                onTagInputChange={setTagInput}
                onTagsAdd={(newTags) =>
                  setTags((prev) => [...new Set([...prev, ...newTags])])
                }
                onTagRemove={(i) => setTags((prev) => prev.filter((_, idx) => idx !== i))}
                onTagsAISuggest={handleGenerateAllMetadata}
                seoKeywords={seoKeywords}
                seoKeywordInput={seoKeywordInput}
                onSeoKeywordInputChange={setSeoKeywordInput}
                onSeoKeywordsAdd={(kw) =>
                  setSeoKeywords((prev) => [...new Set([...prev, ...kw])])
                }
                onSeoKeywordRemove={(i) =>
                  setSeoKeywords((prev) => prev.filter((_, idx) => idx !== i))
                }
                onSeoKeywordsAISuggest={handleGenerateAllMetadata}
                author={author}
                onAuthorChange={setAuthor}
                featured={featured}
                onFeaturedChange={setFeatured}
                model={model}
                modelOptions={modelOptions}
                onModelChange={setModel}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        </form>

        {/* Modals */}
        {showAIGenerate && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => !isGenerating && setShowAIGenerate(false)}
          >
            <div
              className="bg-slate-900 rounded-xl border border-slate-800 mx-4 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-400" />
                AI Generate Article
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Topic</label>
                  <textarea
                    value={aiTopic}
                    onChange={(e) => setAITopic(e.target.value)}
                    placeholder="e.g., Benefits of modern CCTV systems..."
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
                          aiTone === t.value ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
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
                          aiLength === l.value ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
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
                      className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-all duration-200"
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

        {showDiscoverTopics && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => !trendingTopicsLoading && setShowDiscoverTopics(false)}
          >
            <div
              className="bg-slate-900 rounded-2xl border border-slate-800 mx-4 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {discoveryScreen === "setup" ? (
                <>
                  <div className="p-6 border-b border-slate-800">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-red-400" />
                      Discover Trending Topics
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Find trending security topics to write about</p>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Option A: Auto-Discover */}
                    <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 text-red-500">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-white">Auto-Discover Trending Topics</h4>
                          <p className="text-sm text-slate-400 mt-1">
                            AI will search for the latest trending topics across all your security categories
                          </p>
                          <button
                            type="button"
                            onClick={() => runDiscovery({ mode: "auto" })}
                            disabled={trendingTopicsLoading}
                            className="mt-3 bg-red-500 hover:bg-red-600 rounded-lg px-5 py-2.5 text-white text-sm font-medium disabled:opacity-50"
                          >
                            Start Auto-Discovery
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-slate-700" />
                      <span className="text-slate-500 text-sm">Or customize your search</span>
                      <div className="flex-1 h-px bg-slate-700" />
                    </div>

                    {/* Option B: Select Categories */}
                    <div>
                      <h4 className="font-semibold text-white flex items-center gap-2 mb-1">
                        <Grid className="w-4 h-4 text-slate-400" />
                        Select Categories
                      </h4>
                      <p className="text-sm text-slate-400 mb-3">Choose specific categories to focus on</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                        {(discoveryCategories.length ? discoveryCategories : DEFAULT_DISCOVERY_CATEGORIES).map((cat) => {
                          const selected = selectedCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() =>
                                setSelectedCategories((prev) =>
                                  selected ? prev.filter((c) => c !== cat) : [...prev, cat]
                                )
                              }
                              className={`rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between gap-2 border cursor-pointer transition-colors ${
                                selected
                                  ? "bg-red-500/20 border-red-500 text-red-400"
                                  : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                              }`}
                            >
                              <span className="truncate">{cat}</span>
                              {selected && <Check className="w-4 h-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => runDiscovery({ mode: "categories", categories: selectedCategories })}
                        disabled={trendingTopicsLoading || selectedCategories.length === 0}
                        className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none text-sm font-medium"
                      >
                        Discover Selected
                      </button>
                    </div>

                    {/* Option C: Custom Keyword */}
                    <div>
                      <h4 className="font-semibold text-white flex items-center gap-2 mb-1">
                        <Search className="w-4 h-4 text-slate-400" />
                        Search by Keyword
                      </h4>
                      <input
                        type="text"
                        value={discoveryKeyword}
                        onChange={(e) => setDiscoveryKeyword(e.target.value)}
                        placeholder="Type a topic or keyword... e.g., 'AI-powered surveillance', 'smart lock vulnerabilities'"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 mb-3"
                      />
                      <button
                        type="button"
                        onClick={() => runDiscovery({ mode: "keyword", keyword: discoveryKeyword.trim() })}
                        disabled={trendingTopicsLoading || discoveryKeyword.trim().length < 3}
                        className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none text-sm font-medium"
                      >
                        Search Trending
                      </button>
                    </div>

                    <p className="text-sm">
                      <a
                        href="/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        Manage Categories
                      </a>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-800">
                    <h3 className="text-lg font-semibold text-white">Trending Topics</h3>
                    <p className="text-slate-400 text-sm mt-1">{discoverySearchContext}</p>
                    <button
                      type="button"
                      onClick={() => setDiscoveryScreen("setup")}
                      disabled={trendingTopicsLoading}
                      className="mt-2 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      ← Back to setup
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1">
                    {trendingTopicsLoading ? (
                      <>
                        <p className="flex items-center gap-2 text-slate-400 mb-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Searching for trending topics...
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                              key={i}
                              className="bg-slate-800 rounded-xl p-5 border border-slate-700 animate-pulse h-48"
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trendingTopics.map((topic, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-red-500/50 transition-all duration-200 flex flex-col"
                          >
                            <h4 className="font-semibold text-white text-base">{topic.title}</h4>
                            <p className="text-sm text-slate-400 mt-1">{topic.description}</p>
                            <p className="text-xs text-slate-500 italic mt-2 flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5" />
                              {topic.why_trending}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3 mb-4">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-600 text-slate-200">
                                {topic.category}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  topic.interest === "high"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : topic.interest === "medium"
                                      ? "bg-amber-500/20 text-amber-400"
                                      : "bg-slate-600 text-slate-400"
                                }`}
                              >
                                {topic.interest}
                              </span>
                            </div>
                            {topic.source && (
                              <p className="text-xs text-slate-500 italic mt-2 line-clamp-1">
                                Inspired by: &quot;{topic.source}&quot;
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => handleWriteFromTopic(topic)}
                              disabled={isGenerating}
                              className="mt-auto w-full py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all duration-200 disabled:opacity-50"
                            >
                              Write This Article
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-6 border-t border-slate-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => lastDiscoveryPayload && runDiscovery(lastDiscoveryPayload)}
                      disabled={trendingTopicsLoading || !lastDiscoveryPayload}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${trendingTopicsLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscoveryScreen("setup")}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDiscoverTopics(false)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showURLImport && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => !isGenerating && setShowURLImport(false)}
          >
            <div
              className="bg-slate-900 rounded-xl border border-slate-800 mx-4 max-w-lg w-full p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-400" />
                Import from URL
              </h3>
              <div className="space-y-4">
                <input
                  type="url"
                  value={urlImportInput}
                  onChange={(e) => setUrlImportInput(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 placeholder:text-slate-500"
                />
                {isGenerating && generatingAction === "extract_from_url" ? (
                  <div className="flex items-center gap-3 py-4 text-slate-300">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing URL...</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowURLImport(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleURLImport}
                      disabled={!urlImportInput.trim()}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      Import & Generate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <AIImageGenerator
          isOpen={showAIImageGenerator}
          onClose={() => setShowAIImageGenerator(false)}
          onImageSelected={(url) => {
            setCoverImage(url);
            setShowAIImageGenerator(false);
          }}
          articleTitle={title}
          articleContent={content}
        />

        {showImagePicker && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowImagePicker(false)}
          >
            <div
              className="bg-slate-900 rounded-xl border border-slate-800 mx-4 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="font-semibold text-white">Select Image</h3>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
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
