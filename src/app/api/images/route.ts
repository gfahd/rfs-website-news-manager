// ============================================
// FILE: src/app/api/images/route.ts
// Images List API
// ============================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getImages } from "@/lib/github";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const images = await getImages();
  return NextResponse.json({ images });
}
