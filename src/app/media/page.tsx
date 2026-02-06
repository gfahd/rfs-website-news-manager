"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Image as ImageIcon, Upload, Copy, Check } from "lucide-react";

const ACCEPT = ".jpg,.jpeg,.png,.gif,.webp";

function formatSize(bytes: number | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch("/api/images");
      const data = await res.json();
      setImages(data.images || []);
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) fetchImages();
  }, [session, fetchImages]);

  const uploadFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const allowed = ACCEPT.split(",").map((e) => e.trim().toLowerCase());
      const toUpload = Array.from(files).filter((f) =>
        allowed.some((ext) => f.name.toLowerCase().endsWith(ext.replace(".", "")))
      );
      if (!toUpload.length) return;

      setUploadError(null);
      setUploading(true);
      try {
        for (const file of toUpload) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1] ?? "");
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              content: base64,
              mimeType: file.type,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg = data?.details || data?.error || "Upload failed";
            throw new Error(msg);
          }
        }
        await fetchImages();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        setUploadError(message);
        console.error("Upload failed:", error);
      } finally {
        setUploading(false);
      }
    },
    [fetchImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const copyPath = useCallback((path: string) => {
    const toCopy = path.startsWith("/") ? path : `/images/news/${path}`;
    navigator.clipboard.writeText(toCopy).then(() => {
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    });
  }, []);

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
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-slate-800 text-slate-300 text-sm font-medium">
            {loading ? "…" : images.length}
          </span>
        </div>

        {uploadError && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
            {uploadError}
          </div>
        )}

        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mb-8 rounded-xl border-2 border-dashed transition-all ${
            dragActive
              ? "border-red-500 bg-red-500/10"
              : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
          }`}
        >
          <label className="flex flex-col items-center justify-center py-10 px-6 cursor-pointer">
            <input
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Upload className="w-10 h-10 text-slate-400 mb-3" />
            <p className="text-slate-300 font-medium">
              {uploading ? "Uploading…" : "Drop images here or click to upload"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              .jpg, .jpeg, .png, .gif, .webp
            </p>
          </label>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
            <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No images uploaded yet.</p>
            <p className="text-sm text-slate-500 mt-2">
              Drop images above or upload when creating an article.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.path}
                className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-all hover:scale-[1.02] flex flex-col"
              >
                <div className="aspect-square relative bg-slate-800">
                  <img
                    src={img.url || undefined}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <p className="text-sm font-medium text-slate-200 truncate" title={img.name}>
                    {img.name}
                  </p>
                  <p className="text-xs text-slate-500">{formatSize(img.size)}</p>
                  <button
                    type="button"
                    onClick={() => copyPath(img.path)}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-medium transition-colors"
                  >
                    {copiedPath === img.path ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Path
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
