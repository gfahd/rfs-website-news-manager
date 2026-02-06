import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/github";

function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
  };
  return map[mimeType.toLowerCase()] || "";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { filename, content, mimeType } = body;

  const sanitizedName = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/\.[^.]+$/, ""); // strip original extension

  const ext = getExtensionFromMime(mimeType) || ".jpg";
  const timestamp = Date.now();
  const finalFilename = `${timestamp}-${sanitizedName}${ext}`;

  const path = await uploadImage(finalFilename, content, mimeType);
  return NextResponse.json({ path, filename: finalFilename });
}
