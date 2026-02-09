"use client";

import { useState, useCallback } from "react";
import { X, Sparkles, Upload, Loader2, Download, Trash2, RefreshCw } from "lucide-react";
import { useError } from "@/context/ErrorContext";

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "4:3", label: "4:3 (Standard)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "9:16", label: "9:16 (Portrait)" },
] as const;

const IMAGE_MODELS = [
  { id: "gemini-2.5-flash-image", name: "Nano Banana (Fast)" },
  { id: "gemini-3-pro-image-preview", name: "Nano Banana Pro (Quality)" },
];

export interface AIImageGeneratorProps {
  onImageSelected: (imageUrl: string) => void;
  articleTitle?: string;
  articleContent?: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabId = "generate" | "edit";

export function AIImageGenerator({
  onImageSelected,
  articleTitle,
  articleContent,
  isOpen,
  onClose,
}: AIImageGeneratorProps) {
  const [tab, setTab] = useState<TabId>("generate");
  const [promptText, setPromptText] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [imageModel, setImageModel] = useState("gemini-2.5-flash-image");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { showError } = useError();

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedMimeType, setGeneratedMimeType] = useState<string>("image/png");
  const [generatedModelName, setGeneratedModelName] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ image: string; mimeType: string }>>([]);

  const clearGenerated = useCallback(() => {
    setGeneratedImage(null);
    setGeneratedMimeType("image/png");
    setGeneratedModelName(null);
  }, []);

  const handleAutoSuggest = useCallback(async () => {
    if (!articleTitle && !articleContent) return;
    setIsSuggesting(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_image_prompt",
          payload: {
            title: articleTitle || "Untitled",
            content: (articleContent || "").slice(0, 2000),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to suggest prompt");
      setPromptText(data.prompt ?? "");
    } catch (e) {
      showError("Failed to suggest prompt", e instanceof Error ? e.message : String(e));
    } finally {
      setIsSuggesting(false);
    }
  }, [articleTitle, articleContent, showError]);

  const handleGenerate = useCallback(async () => {
    if (!promptText.trim()) {
      showError("Enter a prompt to generate an image.");
      return;
    }
    setIsGenerating(true);
    clearGenerated();
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          prompt: promptText.trim(),
          aspectRatio: aspectRatio || "16:9",
          model: imageModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image generation failed");
      if (!data.image) throw new Error("No image was generated.");
      setGeneratedImage(data.image);
      setGeneratedMimeType(data.mimeType || "image/png");
      const modelName = IMAGE_MODELS.find((m) => m.id === data.model)?.name ?? data.model;
      setGeneratedModelName(modelName);
      setHistory((prev) => [...prev.slice(-7), { image: data.image, mimeType: data.mimeType || "image/png" }]);
    } catch (e) {
      showError("Image generation failed", e instanceof Error ? e.message : String(e));
    } finally {
      setIsGenerating(false);
    }
  }, [promptText, aspectRatio, imageModel, clearGenerated, showError]);

  const handleEdit = useCallback(async () => {
    if (!uploadedFile || !editInstructions.trim()) {
      showError("Upload an image and enter edit instructions.");
      return;
    }
    setIsGenerating(true);
    clearGenerated();
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        showError("Could not read image.");
        setIsGenerating(false);
        return;
      }
      try {
        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "edit",
            prompt: editInstructions.trim(),
            imageBase64: base64,
            imageMimeType: uploadedFile.type || "image/jpeg",
            aspectRatio: aspectRatio || "16:9",
            model: imageModel,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Edit failed");
        if (!data.image) throw new Error("No image was generated.");
        setGeneratedImage(data.image);
        setGeneratedMimeType(data.mimeType || "image/png");
        const modelName = IMAGE_MODELS.find((m) => m.id === data.model)?.name ?? data.model;
        setGeneratedModelName(modelName);
        setHistory((prev) => [...prev.slice(-7), { image: data.image, mimeType: data.mimeType || "image/png" }]);
      } catch (e) {
        showError("Edit failed", e instanceof Error ? e.message : String(e));
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(uploadedFile);
  }, [uploadedFile, editInstructions, aspectRatio, imageModel, clearGenerated, showError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    setUploadedFile(file);
    setUploadPreviewUrl(URL.createObjectURL(file));
  }, [uploadPreviewUrl]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
      setUploadedFile(file);
      setUploadPreviewUrl(URL.createObjectURL(file));
    },
    [uploadPreviewUrl]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  const handleUseAsCover = useCallback(async () => {
    if (!generatedImage) return;
    setIsSaving(true);
    try {
      const saveRes = await fetch("/api/ai/image/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: generatedImage,
          mimeType: generatedMimeType,
          filename: `cover-${(articleTitle || "generated").slice(0, 30).replace(/[^a-z0-9-]/gi, "-")}`,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Save failed");
      onImageSelected(saveData.url);
      onClose();
    } catch (e) {
      showError("Save failed", e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  }, [generatedImage, generatedMimeType, articleTitle, onImageSelected, onClose, showError]);

  const handleDownload = useCallback(() => {
    if (!generatedImage) return;
    const ext = generatedMimeType === "image/png" ? "png" : "jpg";
    const a = document.createElement("a");
    a.href = `data:${generatedMimeType};base64,${generatedImage}`;
    a.download = `ai-cover-${Date.now()}.${ext}`;
    a.click();
  }, [generatedImage, generatedMimeType]);

  const handleRegenerate = useCallback(() => {
    if (tab === "generate") handleGenerate();
    else handleEdit();
  }, [tab, handleGenerate, handleEdit]);

  const handleSelectHistory = useCallback((item: { image: string; mimeType: string }) => {
    setGeneratedImage(item.image);
    setGeneratedMimeType(item.mimeType);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-2xl border border-slate-800 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">AI Cover Image</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 p-4 pb-0">
          <button
            type="button"
            onClick={() => setTab("generate")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "generate" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Generate New Image
          </button>
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "edit" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Edit Existing Image
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {tab === "generate" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Image Model</label>
                <select
                  value={imageModel}
                  onChange={(e) => setImageModel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-sm px-4 py-2.5 focus:border-red-500 focus:outline-none mb-4"
                >
                  {IMAGE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Prompt</label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Describe the image you want... e.g., Modern CCTV camera system on a commercial building at sunset"
                  rows={3}
                  className="w-full bg-slate-800 rounded-xl p-4 text-white placeholder-slate-500 border border-slate-700 focus:border-red-500 focus:outline-none resize-none"
                />
                {(articleTitle || articleContent) && (
                  <button
                    type="button"
                    onClick={handleAutoSuggest}
                    disabled={isSuggesting}
                    className="mt-2 text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Auto-suggest from article
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Aspect ratio</label>
                <div className="flex flex-wrap gap-2">
                  {ASPECT_RATIOS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setAspectRatio(r.value)}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        aspectRatio === r.value
                          ? "bg-slate-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !promptText.trim()}
                className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating image...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Image
                  </>
                )}
              </button>
            </>
          )}

          {tab === "edit" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Image Model</label>
                <select
                  value={imageModel}
                  onChange={(e) => setImageModel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-sm px-4 py-2.5 focus:border-red-500 focus:outline-none mb-4"
                >
                  {IMAGE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-amber-400 mb-2">Tip: Use Nano Banana Pro for best editing results</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Image to edit</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50 min-h-[140px] flex flex-col items-center justify-center p-4"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="ai-edit-upload"
                  />
                  {uploadPreviewUrl ? (
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                      <img
                        src={uploadPreviewUrl}
                        alt="Upload preview"
                        className="max-h-full w-full object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <label
                      htmlFor="ai-edit-upload"
                      className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-slate-300"
                    >
                      <Upload className="w-10 h-10" />
                      <span className="text-sm">Drop an image or click to upload</span>
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Edit instructions</label>
                <textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  placeholder="Describe how to edit this image... e.g., Add a dark overlay, make it look more dramatic, add security camera elements"
                  rows={3}
                  className="w-full bg-slate-800 rounded-xl p-4 text-white placeholder-slate-500 border border-slate-700 focus:border-red-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Aspect ratio</label>
                <div className="flex flex-wrap gap-2">
                  {ASPECT_RATIOS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setAspectRatio(r.value)}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        aspectRatio === r.value
                          ? "bg-slate-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleEdit}
                disabled={isGenerating || !uploadedFile || !editInstructions.trim()}
                className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Editing image...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Edit Image
                  </>
                )}
              </button>
            </>
          )}

          {isGenerating && !generatedImage && (
            <div className="aspect-video rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 animate-pulse" />
            </div>
          )}

          {generatedImage && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">Result</label>
              <div className="rounded-xl shadow-lg bg-slate-950 overflow-hidden flex items-center justify-center max-h-[400px]">
                <img
                  src={`data:${generatedMimeType};base64,${generatedImage}`}
                  alt="Generated"
                  className="max-h-[400px] w-full object-contain"
                />
              </div>
              {generatedModelName && (
                <p className="text-xs text-slate-500">Generated with {generatedModelName}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleUseAsCover}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Use as Cover Image
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={clearGenerated}
                  className="inline-flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Discard
                </button>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Recent</label>
              <div className="grid grid-cols-4 gap-2">
                {history.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectHistory(item)}
                    className="aspect-square w-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-red-500 transition-colors focus:outline-none"
                  >
                    <img
                      src={`data:${item.mimeType};base64,${item.image}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
