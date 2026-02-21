import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getPublicConfigs,
  upsertPublicConfig,
  upsertPublicConfigs,
} from "@/lib/public-configs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await getPublicConfigs();
  return NextResponse.json({ configs });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { key: string; value: string; description?: string | null } | Array<{ key: string; value: string; description?: string | null }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (Array.isArray(body)) {
      await upsertPublicConfigs(body);
    } else if (body && typeof body.key === "string" && typeof body.value === "string") {
      await upsertPublicConfig(body.key, body.value, body.description);
    } else {
      return NextResponse.json({ error: "Body must be { key, value } or array of { key, value }" }, { status: 400 });
    }
    const configs = await getPublicConfigs();
    return NextResponse.json({ success: true, configs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update public configs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
