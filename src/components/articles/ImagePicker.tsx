"use client";

import { Upload, Image as ImageIcon, X, Sparkles } from "lucide-react";

export interface ImageItem {
  name: string;
  path: string;
  url?: string;
}

interface ImagePickerProps {
  coverImage: string;
  onCoverImageChange: (path: string) => void;
  images: ImageItem[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenLibrary: () => void;
  onAISuggest: () => void;
  aiSuggestDisabled?: boolean;
  imagePromptResult: string | null;
  onDismissPrompt: () => void;
}

export function ImagePicker({
  coverImage,
  onCoverImageChange,
  images,
  onUpload,
  onOpenLibrary,
  onAISuggest,
  aiSuggestDisabled,
  imagePromptResult,
  onDismissPrompt,
}: ImagePickerProps) {
  return (
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
            onClick={() => onCoverImageChange("")}
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
            onChange={onUpload}
            className="hidden"
          />
        </label>
        <button
          type="button"
          onClick={onOpenLibrary}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all duration-200"
        >
          <ImageIcon className="w-4 h-4" />
          Choose from Library
        </button>
        <button
          type="button"
          onClick={onAISuggest}
          disabled={aiSuggestDisabled}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all duration-200 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          AI Suggest
        </button>
        {coverImage && (
          <button
            type="button"
            onClick={() => onCoverImageChange("")}
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
            onClick={onDismissPrompt}
            className="mt-2 text-slate-500 hover:text-white text-xs"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
