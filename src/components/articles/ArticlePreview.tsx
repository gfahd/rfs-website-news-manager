// ============================================
// FILE: src/components/articles/ArticlePreview.tsx
// Live preview of article as it will appear on the website
// ============================================

"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const CATEGORY_STYLES: Record<string, string> = {
  "threat-intel": "bg-red-500/15 text-red-600",
  technology: "bg-blue-500/15 text-blue-600",
  "company-news": "bg-slate-500/15 text-slate-600",
  guides: "bg-emerald-500/15 text-emerald-600",
  "security-tips": "bg-amber-500/15 text-amber-600",
  "industry-trends": "bg-violet-500/15 text-violet-600",
};

export interface ArticlePreviewProps {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
}

function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

function getCoverImageSrc(coverImage: string): string {
  if (!coverImage) return "";
  if (coverImage.startsWith("/images/news/")) {
    return `/api/serve-image?path=${encodeURIComponent(coverImage)}`;
  }
  return coverImage;
}

export function ArticlePreview({
  title,
  excerpt,
  content,
  coverImage,
  category,
  tags,
  author,
  publishedAt,
}: ArticlePreviewProps) {
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.ceil(wordCount / 200) || 1;
  const readTimeLabel = `${readTime} min read`;
  const categoryStyle = CATEGORY_STYLES[category] ?? "bg-slate-500/15 text-slate-600";
  const coverSrc = getCoverImageSrc(coverImage);

  const markdownComponents: Components = {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-slate-900 mt-10 mb-4 pb-2 border-b-2 border-slate-200 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4 pb-2 border-b-2 border-slate-200">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold text-slate-800 mt-8 mb-3">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-base leading-relaxed text-slate-700 mb-4">{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="text-slate-900 font-semibold">{children}</strong>
    ),
    ul: ({ children }) => <ul className="my-4 pl-6 list-disc">{children}</ul>,
    ol: ({ children }) => <ol className="my-4 pl-6 list-decimal">{children}</ol>,
    li: ({ children }) => (
      <li className="text-base text-slate-700 mb-2 leading-relaxed">{children}</li>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-red-600 underline underline-offset-2 hover:text-red-700"
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-red-500 pl-5 py-3 my-6 bg-slate-50 rounded-r-lg italic text-slate-600">
        {children}
      </blockquote>
    ),
    code: ({ className, ...props }) =>
      className ? (
        <code
          className="bg-slate-900 text-slate-100 p-4 rounded-xl block overflow-x-auto text-sm font-mono my-4"
          {...props}
        />
      ) : (
        <code
          className="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        />
      ),
    pre: ({ children }) => <pre className="my-4">{children}</pre>,
    hr: () => <hr className="border-0 border-t border-slate-200 my-6" />,
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-900">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-slate-200 px-3 py-2 text-slate-700">{children}</td>
    ),
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-w-4xl mx-auto">
      <div className="p-8 md:p-12">
        {/* Header */}
        <div>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyle}`}
          >
            {category.replace(/-/g, " ")}
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-3 leading-tight">
            {title || "Untitled"}
          </h1>
          {excerpt && (
            <p className="text-lg text-slate-500 mt-3 italic">{excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-slate-500">
            <span>{author || "Red Flag Security Team"}</span>
            <span>·</span>
            <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
            <span>·</span>
            <span>{readTimeLabel}</span>
          </div>
          <div className="border-b border-slate-200 my-6" />
        </div>

        {/* Cover image */}
        {coverSrc && (
          <div className="mb-8 -mx-8 md:-mx-12">
            <img
              src={coverSrc}
              alt=""
              className="w-full aspect-video object-cover rounded-xl"
            />
          </div>
        )}

        {/* Article body */}
        <div className="article-preview">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {content || "*No content yet.*"}
          </ReactMarkdown>
        </div>

        {/* Tags footer */}
        {tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
