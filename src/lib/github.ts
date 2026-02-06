import { Octokit } from "@octokit/rest";
import matter from "gray-matter";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OWNER = process.env.GITHUB_OWNER!;
const REPO = process.env.GITHUB_REPO!;
const BRANCH = "main";

export async function getArticles() {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: "out/news",
      ref: BRANCH,
    });

    if (!Array.isArray(data)) {
      return [];
    }

    const articles = await Promise.all(
      data
        .filter(
          (file: { name: string }) =>
            file.name.endsWith(".md") && !file.name.startsWith("_")
        )
        .map(async (file: { path: string; name: string }) => {
          const content = await getFileContent(file.path);
          return parseArticle(file.name, content);
        })
    );

    return articles.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

export async function getArticle(slug: string) {
  const articles = await getArticles();
  return articles.find((a) => a.slug === slug) || null;
}

export async function getFileContent(path: string): Promise<string> {
  const { data } = await octokit.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path,
    ref: BRANCH,
  });

  if ("content" in data && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  return "";
}

export async function saveArticle(
  slug: string,
  content: string,
  message: string
) {
  const path = `out/news/${slug}.md`;

  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
      ref: BRANCH,
    });
    if ("sha" in data) {
      sha = data.sha;
    }
  } catch {
    // File doesn't exist
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    branch: BRANCH,
    sha,
  });
}

export async function deleteArticle(slug: string) {
  const path = `out/news/${slug}.md`;

  const { data } = await octokit.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path,
    ref: BRANCH,
  });

  if ("sha" in data) {
    await octokit.repos.deleteFile({
      owner: OWNER,
      repo: REPO,
      path,
      message: `Delete article: ${slug}`,
      sha: data.sha,
      branch: BRANCH,
    });
  }
}

export async function uploadImage(
  filename: string,
  content: string,
  mimeType: string
) {
  const path = `public/images/news/${filename}`;

  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
      ref: BRANCH,
    });
    if ("sha" in data) {
      sha = data.sha;
    }
  } catch {
    // File doesn't exist
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path,
    message: `Upload image: ${filename}`,
    content,
    branch: BRANCH,
    sha,
  });

  return `/images/news/${filename}`;
}

export async function getImages() {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: "public/images/news",
      ref: BRANCH,
    });

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter((file: { name: string }) =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
      )
      .map((file: { name: string; size?: number; download_url?: string | null }) => ({
        name: file.name,
        path: `/images/news/${file.name}`,
        size: file.size,
        url: file.download_url ?? undefined,
      }));
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
}

function parseArticle(filename: string, content: string) {
  const { data, content: body } = matter(content);

  const slug = filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/\.md$/, "");

  return {
    slug,
    filename,
    title: data.title || "",
    excerpt: data.excerpt || "",
    category: data.category || "company-news",
    publishedAt: data.publishedAt || new Date().toISOString(),
    coverImage: data.coverImage || "",
    tags: data.tags || [],
    seoKeywords: data.seoKeywords || [],
    author: data.author || "Red Flag Security Team",
    featured: data.featured || false,
    draft: data.draft ?? false,
    content: body,
  };
}
