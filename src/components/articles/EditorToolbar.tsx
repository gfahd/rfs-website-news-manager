"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  PenLine,
  Save,
  Send,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import type { AIModelOption } from "@/lib/settings-client";

export type ArticleStatus = "published" | "draft" | "unsaved";

export interface EditorToolbarProps {
  title: string;
  isEditPage?: boolean;
  status: ArticleStatus;
  viewMode: "edit" | "preview";
  onViewModeChange: (mode: "edit" | "preview") => void;
  model: string;
  modelOptions: AIModelOption[];
  onModelChange: (value: string) => void;
  onSaveDraft: (e?: React.MouseEvent) => void | Promise<void>;
  saving: boolean;
  saveSuccess?: boolean;
}

export function EditorToolbar({
  title,
  isEditPage,
  status,
  viewMode,
  onViewModeChange,
  model,
  modelOptions,
  onModelChange,
  onSaveDraft,
  saving,
  saveSuccess,
}: EditorToolbarProps) {
  const statusColor =
    status === "published"
      ? "bg-emerald-500"
      : status === "draft"
        ? "bg-amber-500"
        : "bg-slate-500";

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-4 md:px-6 py-3 sticky top-0 z-30 -mx-4 md:-mx-8 transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back + Title + Status */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/articles"
            className="p-2 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200 shrink-0"
            aria-label="Back to articles"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`}
              title={status}
              aria-hidden
            />
          </div>
        </div>

        {/* Center: Edit / Preview toggle */}
        <div className="flex items-center rounded-lg overflow-hidden border border-slate-700 bg-slate-800 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("edit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
              viewMode === "edit"
                ? "bg-slate-700 text-white"
                : "bg-transparent text-slate-400 hover:text-white"
            }`}
          >
            <PenLine className="w-4 h-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
              viewMode === "preview"
                ? "bg-slate-700 text-white"
                : "bg-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        {/* Right: Model selector, Save Draft, Publish */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
            <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={modelOptions.some((o) => o.value === model) ? model : modelOptions[0]?.value ?? model}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-transparent text-slate-200 text-sm focus:outline-none border-none py-1 pr-1 cursor-pointer min-w-0"
            >
              {modelOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-2 text-sm transition-all duration-200 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : null}
            <span className="hidden md:inline">
              {saving ? "Saving..." : "Save Draft"}
            </span>
            {!saving && !saveSuccess && <Save className="w-4 h-4 md:hidden" />}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-lg px-5 py-2 font-medium text-sm transition-all duration-200 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Send className="w-4 h-4 shrink-0" />
            )}
            {isEditPage ? "Update" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
