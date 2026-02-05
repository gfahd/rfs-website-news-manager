// ============================================
// FILE: src/app/api/upload/route.ts
// Image Upload API
// ============================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/github";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { filename, content, mimeType } = body;

  // Sanitize filename
  const sanitizedFilename = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");

  // Add timestamp to avoid conflicts
  const timestamp = Date.now();
  const finalFilename = `${timestamp}-${sanitizedFilename}`;

  const path = await uploadImage(finalFilename, content, mimeType);

  return NextResponse.json({ path, filename: finalFilename });
}
