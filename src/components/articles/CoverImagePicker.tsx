"use client";

import React from "react";
import { Upload, Image as ImageIcon, Sparkles, X } from "lucide-react";

export interface CoverImagePickerProps {
  coverImage: string;
  onCoverImageChange: (url: string) => void;
  onLibraryClick: () => void;
  onAIGenerateClick: () => void;
  onUploadComplete?: (path: string, name: string) => void;
  onUploadError?: (message: string) => void;
}

function getCoverSrc(coverImage: string): string {
  if (!coverImage) return "";
  if (coverImage.startsWith("/images/news/")) {
    return `/api/serve-image?path=${encodeURIComponent(coverImage)}`;
  }
  return coverImage;
}

export function CoverImagePicker({
  coverImage,
  onCoverImageChange,
  onLibraryClick,
  onAIGenerateClick,
  onUploadComplete,
  onUploadError,
}: CoverImagePickerProps) {
  const src = getCoverSrc(coverImage);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          onCoverImageChange(data.path);
          onUploadComplete?.(data.path, file.name);
        } else {
          onUploadError?.("Upload failed");
        }
      } catch {
        onUploadError?.("Failed to upload image");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {src ? (
        <div className="relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700 aspect-video">
          <img
            src={src}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onCoverImageChange("")}
            className="absolute top-2 right-2 p-1.5 bg-slate-900/90 hover:bg-red-600 rounded-lg transition-all duration-200 text-white"
            aria-label="Remove cover image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-all duration-200"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
        <button
          type="button"
          onClick={onLibraryClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-all duration-200"
        >
          <ImageIcon className="w-4 h-4" />
          Library
        </button>
        <button
          type="button"
          onClick={onAIGenerateClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500/90 to-orange-500/90 hover:from-red-500 hover:to-orange-500 text-white text-sm font-medium transition-all duration-200"
        >
          <Sparkles className="w-4 h-4" />
          AI Generate
        </button>
      </div>
    </div>
  );
}
