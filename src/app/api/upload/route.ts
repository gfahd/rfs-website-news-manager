import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { filename, content, mimeType } = await request.json();
    if (!filename || typeof content !== "string") {
      return NextResponse.json(
        { error: "Missing filename or image content" },
        { status: 400 }
      );
    }
    const url = await uploadImage(filename, content, mimeType || "image/jpeg");
    return NextResponse.json({ path: url, url, filename });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
