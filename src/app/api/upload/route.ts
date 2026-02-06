// ============================================
// FILE: src/app/api/upload/route.ts
// Image Upload API
// ============================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/github";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

function getExtensionFromMime(mimeType: string): string {
  return MIME_TO_EXT[mimeType?.toLowerCase()] ?? "png";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { filename, content, mimeType } = body;

  // Sanitize filename (strip extension first so it isn't corrupted)
  const baseName = filename.replace(/\.[^.]*$/, "").trim() || "image";
  const sanitizedBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const ext = getExtensionFromMime(mimeType);
  const timestamp = Date.now();
  const finalFilename = `${timestamp}-${sanitizedBase}.${ext}`;

  const path = await uploadImage(finalFilename, content, mimeType);

  return NextResponse.json({ path, filename: finalFilename });
}
