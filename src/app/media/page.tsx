"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Image as ImageIcon, Upload } from "lucide-react";

export default function MediaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    }
    if (session) fetchImages();
  }, [session]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-slate-400 mt-1">
            Manage images and files for your articles
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
            <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No images uploaded yet.</p>
            <p className="text-sm text-slate-500 mt-2">
              Upload images when creating or editing an article.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img: any) => (
              <div
                key={img.path}
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden group"
              >
                <div className="aspect-square relative bg-slate-700">
                  <img
                    src={img.url || img.path}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{img.name}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono truncate">
                    {img.path}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
