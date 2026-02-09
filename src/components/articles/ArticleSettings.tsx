"use client";

import { X, Sparkles } from "lucide-react";
import type { AIModelOption } from "@/lib/settings-client";

export interface CategoryOption {
  value: string;
  label: string;
}

export interface ArticleSettingsProps {
  categories: CategoryOption[];
  category: string;
  onCategoryChange: (value: string) => void;
  onCategoryAISuggest: () => void;
  publishedAt: string;
  onPublishedAtChange: (value: string) => void;
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onTagsAdd: (tags: string[]) => void;
  onTagRemove: (index: number) => void;
  onTagsAISuggest: () => void;
  seoKeywords: string[];
  seoKeywordInput: string;
  onSeoKeywordInputChange: (value: string) => void;
  onSeoKeywordsAdd: (keywords: string[]) => void;
  onSeoKeywordRemove: (index: number) => void;
  onSeoKeywordsAISuggest: () => void;
  author: string;
  onAuthorChange: (value: string) => void;
  featured: boolean;
  onFeaturedChange: (value: boolean) => void;
  model: string;
  modelOptions: AIModelOption[];
  onModelChange: (value: string) => void;
  isGenerating?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}

function addFromInput(
  value: string,
  add: (items: string[]) => void,
  clearInput: () => void
) {
  const trimmed = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (trimmed.length) {
    add(trimmed);
    clearInput();
  }
}

export function ArticleSettings({
  categories,
  category,
  onCategoryChange,
  onCategoryAISuggest,
  publishedAt,
  onPublishedAtChange,
  tags,
  tagInput,
  onTagInputChange,
  onTagsAdd,
  onTagRemove,
  onTagsAISuggest,
  seoKeywords,
  seoKeywordInput,
  onSeoKeywordInputChange,
  onSeoKeywordsAdd,
  onSeoKeywordRemove,
  onSeoKeywordsAISuggest,
  author,
  onAuthorChange,
  featured,
  onFeaturedChange,
  model,
  modelOptions,
  onModelChange,
  isGenerating,
  showDelete,
  onDelete,
  deleting,
}: ArticleSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Article Settings card */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 transition-all duration-200">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">
          Article Settings
        </h3>
        <div className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Category
            </label>
            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 text-sm transition-all duration-200"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onCategoryAISuggest}
                disabled={isGenerating}
                className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all duration-200 disabled:opacity-50"
                title="AI Suggest"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Publish Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Publish Date
            </label>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => onPublishedAtChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 text-sm transition-all duration-200"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => onTagInputChange(e.target.value)}
                placeholder="Type and press Enter"
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 text-sm placeholder:text-slate-500 transition-all duration-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFromInput(tagInput, onTagsAdd, () => onTagInputChange(""));
                  }
                }}
                onBlur={() =>
                  addFromInput(tagInput, onTagsAdd, () => onTagInputChange(""))
                }
              />
              <button
                type="button"
                onClick={onTagsAISuggest}
                disabled={isGenerating}
                className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all duration-200 disabled:opacity-50"
                title="AI Suggest"
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
                    onClick={() => onTagRemove(i)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* SEO Keywords */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              SEO Keywords
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={seoKeywordInput}
                onChange={(e) => onSeoKeywordInputChange(e.target.value)}
                placeholder="Type and press Enter"
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 text-sm placeholder:text-slate-500 transition-all duration-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFromInput(seoKeywordInput, onSeoKeywordsAdd, () =>
                      onSeoKeywordInputChange("")
                    );
                  }
                }}
                onBlur={() =>
                  addFromInput(seoKeywordInput, onSeoKeywordsAdd, () =>
                    onSeoKeywordInputChange("")
                  )
                }
              />
              <button
                type="button"
                onClick={onSeoKeywordsAISuggest}
                disabled={isGenerating}
                className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all duration-200 disabled:opacity-50"
                title="AI Suggest"
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
                    onClick={() => onSeoKeywordRemove(i)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => onAuthorChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-red-500 text-slate-100 text-sm transition-all duration-200"
              placeholder="Author name"
            />
          </div>

          {/* Featured */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">
              Featured
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={featured}
              onClick={() => onFeaturedChange(!featured)}
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
        </div>
      </div>

      {/* Gemini Model card */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 transition-all duration-200">
        <label className="block text-xs font-medium text-slate-400 mb-2">
          AI Model
        </label>
        <select
          value={modelOptions.some((o) => o.value === model) ? model : modelOptions[0]?.value ?? model}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-red-500 transition-all duration-200"
        >
          {modelOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-2">
          Used for all AI features
        </p>
      </div>

      {/* Delete Article (edit mode only) */}
      {showDelete && onDelete && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="w-full py-2 px-4 bg-transparent text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg text-sm transition-all duration-200 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Article"}
          </button>
        </div>
      )}
    </div>
  );
}
