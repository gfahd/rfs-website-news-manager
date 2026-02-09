import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { imageBase64, mimeType, filename } = await request.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }
    const url = await uploadImage(
      filename || "ai-generated-cover",
      imageBase64,
      mimeType || "image/png"
    );
    return NextResponse.json({ url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
