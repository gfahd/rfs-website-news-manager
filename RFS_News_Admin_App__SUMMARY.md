# Red Flag News Admin - Application Summary

This document provides a technical overview of the Red Flag News Admin application, specifically designed to help an AI agent understand the architecture, data flow, and deployment model.

## 1. Application Overview
**Red Flag News Admin** is a bespoke Content Management System (CMS) built with **Next.js**. It is used to manage news articles for a separate public-facing website (Red Flag Security).

*   **Role**: Admin Interface.
*   **Target**: Manages content consumed by the public site.
*   **Database**: **Supabase** — PostgreSQL for articles, Supabase Storage for images. GitHub is no longer used as content storage.

## 2. Technology Stack
*   **Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS 4
*   **Authentication**: NextAuth.js (Google OAuth, restricted to specific email domains)
*   **Data Layer**: **Supabase** (via `@supabase/supabase-js`) — articles in PostgreSQL, images in Storage
*   **State Management**: Server Actions / API Routes

## 3. Data Storage & Structure
Content lives in **Supabase**, not in a GitHub repository.

### Articles
*   **Location**: Supabase PostgreSQL table `articles`.
*   **Structure**: Row per article with columns such as `id`, `slug`, `title`, `excerpt`, `content`, `category`, `published_at`, `cover_image`, `tags`, `seo_keywords`, `author`, `featured`, `status` (`published` | `draft`), `created_at`, `updated_at`.
*   **Logic**: Handled in `src/lib/supabase.ts` — `getArticles`, `getArticle`, `createArticle`, `updateArticle`, `deleteArticle`, `articleToFrontend` (maps snake_case to camelCase for the frontend).

### Images
*   **Location**: Supabase Storage bucket `news-images`.
*   **Upload Method**: Base64 payload sent to `/api/upload`; server uploads to Supabase Storage and returns the public URL.
*   **Serving**: Articles store the full public URL (e.g. `https://...supabase.co/storage/v1/object/public/news-images/...`). The frontend supports both legacy paths (`/images/news/...`) via a serve-image proxy and full URLs used as-is.

### GitHub (reduced role)
*   **No longer used** for storing articles or images.
*   **Still used**: Optional **website rebuild trigger**. On publish/update/delete, the admin can trigger a GitHub repository dispatch (`rfs-website`) so the public site’s CI can rebuild and redeploy. See `triggerWebsiteRebuild()` in `src/lib/supabase.ts`. Requires `GITHUB_TOKEN` and `GITHUB_OWNER` (no `GITHUB_REPO` for content).

## 4. Workflow & Deployment
1.  **Content Creation**:
    *   User logs into **Red Flag News Admin**.
    *   User creates/edits an article (and optionally uploads images).
    *   Admin App writes to **Supabase** (articles table and/or Storage).

2.  **Visibility on the public site**:
    *   If the **public website** reads articles and images from the **same Supabase project**, it can show new/updated content as soon as it refetches (e.g. on demand or on next build).
    *   If the public site is static and needs a rebuild to pull from Supabase, a **rebuild trigger** is sent via GitHub repo dispatch (`triggerWebsiteRebuild`). Rebuild/redeploy steps depend on the public site’s setup (e.g. see DEPLOYMENT.md if applicable).

3.  **Success message**: After publish/update, the articles list shows a banner: “Article saved to the database” and notes that the live site may update automatically or after a rebuild depending on setup.

## 5. Key Environment Variables
Stored in `.env.local`:

*   **Supabase (required for content)**  
    *   `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`: Server-side access (API routes).  
    *   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: For any client-side Supabase usage (e.g. public read).

*   **GitHub (optional — only for rebuild trigger)**  
    *   `GITHUB_TOKEN`: Token with repo dispatch permission for the website repo.  
    *   `GITHUB_OWNER`: GitHub org/username (e.g. for `owner/rfs-website`).

*   **Auth**  
    *   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, etc.

*   **AI (optional)**  
    *   `GEMINI_API_KEY`: For AI features in the admin (e.g. generate article, metadata, improve text).

## 6. Codebase Context
*   **`src/lib/supabase.ts`**: Main data layer. Supabase clients (`supabaseAdmin`, `supabasePublic`), article CRUD, `articleToFrontend`, image upload/list (`uploadImage`, `getImages`), `triggerWebsiteRebuild`, `generateSlug`.
*   **`src/lib/github.ts`**: Effectively deprecated for content; kept as a stub. Rebuild trigger lives in `supabase.ts`.
*   **`src/app/api/articles/`**, **`src/app/api/articles/[slug]/`**: Use Supabase for list/get/create/update/delete; return data in frontend shape via `articleToFrontend`.
*   **`src/app/api/images/`**, **`src/app/api/upload/`**: Use Supabase Storage for listing and uploading images.
*   **`src/app/api/ai/route.ts`**: Unchanged; AI actions (e.g. Gemini) for generate/improve/metadata.
*   **Auth**: Unchanged; NextAuth with existing config.
