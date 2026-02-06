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
  return map[mimeType?.toLowerCase()] || "";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      console.error("Upload failed: missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO");
      return NextResponse.json(
        { error: "Upload not configured. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO on the server." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { filename, content, mimeType } = body;

    if (!filename || typeof content !== "string") {
      return NextResponse.json(
        { error: "Missing filename or image content" },
        { status: 400 }
      );
    }

    const sanitizedName = String(filename)
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/\.[^.]+$/, ""); // strip original extension

    const ext = getExtensionFromMime(mimeType) || ".jpg";
    const timestamp = Date.now();
    const finalFilename = `${timestamp}-${sanitizedName}${ext}`;

    const path = await uploadImage(finalFilename, content, mimeType);
    return NextResponse.json({ path, filename: finalFilename });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed", details: message },
      { status: 500 }
    );
  }
}
