"use client";

import {
  Sparkles,
  TrendingUp,
  Link as LinkIcon,
  Tags,
  Loader2,
} from "lucide-react";

export interface AIToolsPanelProps {
  onGenerateFullArticle: () => void;
  onDiscoverTopics: () => void;
  onImportFromURL: () => void;
  onGenerateMetadata: () => void;
  isGenerating?: boolean;
  generatingAction?: string;
}

export function AIToolsPanel({
  onGenerateFullArticle,
  onDiscoverTopics,
  onImportFromURL,
  onGenerateMetadata,
  isGenerating,
  generatingAction,
}: AIToolsPanelProps) {
  const generatingArticle = isGenerating && generatingAction === "generate_article";
  const generatingMetadata = isGenerating && generatingAction === "generate_metadata";

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onGenerateFullArticle}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl py-3 font-medium text-sm transition-all duration-200 disabled:opacity-50"
      >
        {generatingArticle ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        Generate Full Article
      </button>

      <div className="flex items-center gap-3">
        <span className="flex-1 border-t border-slate-700" />
        <span className="text-xs text-slate-500">or</span>
        <span className="flex-1 border-t border-slate-700" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onDiscoverTopics}
          disabled={isGenerating}
          className="flex flex-col items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl py-3 text-sm text-slate-300 transition-all duration-200 disabled:opacity-50"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-center leading-tight">Discover Topics</span>
        </button>
        <button
          type="button"
          onClick={onImportFromURL}
          disabled={isGenerating}
          className="flex flex-col items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl py-3 text-sm text-slate-300 transition-all duration-200 disabled:opacity-50"
        >
          <LinkIcon className="w-4 h-4" />
          <span className="text-center leading-tight">Import from URL</span>
        </button>
        <button
          type="button"
          onClick={onGenerateMetadata}
          disabled={isGenerating}
          className="flex flex-col items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl py-3 text-sm text-slate-300 transition-all duration-200 disabled:opacity-50"
        >
          {generatingMetadata ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Tags className="w-4 h-4" />
          )}
          <span className="text-center leading-tight">Generate Metadata</span>
        </button>
      </div>
    </div>
  );
}
