import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OWNER = process.env.GITHUB_OWNER!;
const REPO = process.env.GITHUB_REPO!;
const BRANCH = "main";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");
  if (!path || !path.startsWith("/images/news/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filename = path.replace(/^\/images\/news\//, "");
  const ghPath = `public/images/news/${filename}`;

  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: ghPath,
      ref: BRANCH,
    });

    if (!("content" in data) || !data.content) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
    const mime = MIME[ext.toLowerCase()] || "image/jpeg";
    const buffer = Buffer.from(data.content, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
