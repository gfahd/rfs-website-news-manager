# Red Flag News Admin - Application Summary

This document provides a technical overview of the Red Flag News Admin application, specifically designed to help an AI agent understand the architecture, data flow, and deployment model.

## 1. Application Overview
**Red Flag News Admin** is a bespoke Content Management System (CMS) built with **Next.js**. It is used to manage news articles for a separate public-facing website (Red Flag Security).

*   **Role**: Admin Interface.
*   **Target**: Manages content consumed by the public site.
*   **Database**: **Supabase** — PostgreSQL for articles and app settings, Supabase Storage for images. GitHub is no longer used as content storage.

## 2. Technology Stack
*   **Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS 4
*   **Authentication**: NextAuth.js (Google OAuth, restricted to specific email domains)
*   **Data Layer**: **Supabase** (via `@supabase/supabase-js`) — articles and settings in PostgreSQL, images in Storage
*   **State Management**: Server Actions / API Routes

## 3. Data Storage & Structure
Content and app configuration live in **Supabase**, not in a GitHub repository.

### Articles
*   **Location**: Supabase PostgreSQL table `articles`.
*   **Structure**: Row per article with columns such as `id`, `slug`, `title`, `excerpt`, `content`, `category`, `published_at`, `cover_image`, `tags`, `seo_keywords`, `author`, `featured`, `status` (`published` | `draft`), `created_at`, `updated_at`.
*   **Logic**: Handled in `src/lib/supabase.ts` — `getArticles`, `getArticle`, `createArticle`, `updateArticle`, `deleteArticle`, `articleToFrontend` (maps snake_case to camelCase for the frontend).

### Settings
*   **Location**: Supabase PostgreSQL table `settings`, single row with `id = "global"`.
*   **Structure**: `AppSettings` includes company info (`company_name`, `company_description`, `website_url`, `default_author`), AI defaults (`default_model`, `default_tone`, `default_article_length`, `ai_models` as array of `{ value, label }`), AI instructions and constraints (`ai_instructions`, `ai_forbidden_topics`, `ai_forbidden_companies`), `ai_link_policy` (`internal_only` | `no_links` | `allow_all`), and content organization (`seo_default_keywords`, `categories`).
*   **Logic**: `src/lib/settings.ts` (server) — `getSettings()`, `updateSettings(updates)`; upsert by `id`. Types and client-safe helpers in `src/lib/settings-client.ts` (no Supabase import). API: `GET /api/settings` and `PUT /api/settings` (auth required).

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

2.  **Settings**:
    *   Admin configures company info, AI defaults (including addable AI models and default model), AI instructions/forbidden topics/companies, link policy, and categories/SEO keywords on the **Settings** page. Stored in the `settings` table and injected into all AI prompts.

3.  **Visibility on the public site**:
    *   If the **public website** reads articles and images from the **same Supabase project**, it can show new/updated content as soon as it refetches (e.g. on demand or on next build).
    *   If the public site is static and needs a rebuild to pull from Supabase, a **rebuild trigger** is sent via GitHub repo dispatch (`triggerWebsiteRebuild`). Rebuild/redeploy steps depend on the public site’s setup (e.g. see DEPLOYMENT.md if applicable).

4.  **Success message**: After publish/update, the articles list shows a banner: “Article saved to the database” and notes that the live site may update automatically or after a rebuild depending on setup.

## 5. AI & Settings Integration
*   **`/api/ai`** (POST): Uses `getSettings()` to build a **system prompt prefix** (company name/description, website URL, IMPORTANT INSTRUCTIONS, forbidden competitors/topics, link policy). This prefix is prepended to every AI action: **generate_article**, **improve_text**, **generate_metadata**, **extract_from_url**, **generate_image_prompt** (text description for cover images), **discover_topics** (trending topics with optional focus: Residential, Commercial, Cybersecurity, Industry), and **generate_from_topic** (write article from a discovered topic). Default tone and article length come from settings when the request does not specify them. **discover_topics** uses Google Search grounding for real, current trending content.
*   **Allowed models**: Resolved from `settings.ai_models`; request `model` must be in that list or fallback to `default_model` / first entry. Model IDs are flexible (e.g. any `gemini-*`-style ID can be added in Settings).
*   **Settings page**: Single “Add model” field (model ID string); adding pushes to `ai_models` (value and label both set to the ID) and sets it as default. Default model dropdown is populated from `ai_models`. No separate display-name field; models are not listed in full on the page, only in the dropdown.
*   **AI Image Generation**: **`/api/ai/image`** (POST): Uses **Gemini 2.5 Flash Image** (via `@google/genai`, `GEMINI_IMAGE_MODEL` env) for generate and edit. Settings (company name, ai_instructions) are used to build image prompts. **`/api/ai/image/save`** (POST): Accepts base64 image data and uploads to Supabase Storage via `uploadImage`, returns public URL for use as cover image.

## 6. Article Page UX (New & Edit)
*   **Layout**: Three-zone design — **EditorToolbar** (title “New Article” / “Edit Article”, view mode edit/preview, model selector, Save Draft, status), main editor column (collapsible sections), and **ArticleSettings** sidebar (category, published date, tags, SEO keywords, author, featured, delete on edit). Same structure for `src/app/articles/new/page.tsx` and `src/app/articles/[slug]/page.tsx`. Layout is responsive (e.g. sidebar and two-column editor/settings stack on smaller screens via Tailwind `lg:` breakpoints).
*   **Collapsible sections**: Title & Summary (with AI Fix / AI Generate), Article Content (**ContentEditor** with AI Improve/Format), Cover Image (**CoverImagePicker** — library, upload, AI Generate), AI Tools (**AIToolsPanel** — generate full article, discover topics, import from URL, generate metadata).
*   **Live preview**: **ArticlePreview** component renders article as it will appear on the site. EditorToolbar view mode toggles between “edit” and “preview”; preview is a white card with full article layout.
*   **Trending topics**: “Discover Topics” opens a modal that calls **discover_topics** (with optional focus filter). User can pick a topic and “Write This Article” ( **generate_from_topic** ). Topics show title, description, why_trending, category, interest level.
*   **AI cover image**: **AIImageGenerator** uses `/api/ai` for **generate_image_prompt** from title/content, then `/api/ai/image` to generate (or edit) an image, and `/api/ai/image/save` to persist to Storage and set as cover.
*   **Save Draft**: Toolbar “Save Draft” and keyboard shortcut Ctrl/Cmd+S call **handleSaveDraft**; the event parameter is optional (e.g. when invoked from keyboard), so `e?.preventDefault()` is used. Ctrl/Cmd+Enter submits the form (publish).

## 7. UX: Preserving Input When Switching Windows
*   **Session**: `SessionProvider` uses `refetchOnWindowFocus={false}` so that returning to the tab does not refetch the session and trigger data-load effects that overwrite form state.
*   **Data load once per visit**: Settings, article edit, new article, dashboard, articles list, and media pages use a “loaded once” ref so that initial data fetch (settings, article, images, articles list) runs only once when the session is ready. Switching to another window and back no longer causes a refetch that wipes typed content.

## 8. Key Environment Variables
Stored in `.env.local`:

*   **Supabase (required for content and settings)**  
    *   `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`: Server-side access (API routes).  
    *   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: For any client-side Supabase usage (e.g. public read).

*   **GitHub (optional — only for rebuild trigger)**  
    *   `GITHUB_TOKEN`: Token with repo dispatch permission for the website repo.  
    *   `GITHUB_OWNER`: GitHub org/username (e.g. for `owner/rfs-website`).

*   **Auth**  
    *   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, etc.

*   **AI (optional)**  
    *   `GEMINI_API_KEY`: For AI features in the admin (e.g. generate article, metadata, improve text).

## 9. Codebase Context
*   **`src/lib/supabase.ts`**: Main data layer. Supabase clients (`supabaseAdmin`, `supabasePublic`), article CRUD, `articleToFrontend`, image upload/list (`uploadImage`, `getImages`), `triggerWebsiteRebuild`, `generateSlug`.
*   **`src/lib/settings.ts`**: Server-only. Reads/writes Supabase `settings` table (id = global). `getSettings()`, `updateSettings(updates)`, defaults and normalizers. Do not import from client components.
*   **`src/lib/settings-client.ts`**: Client-safe. `AppSettings`, `AIModelOption`, `GEMINI_MODEL_KEY`, `GEMINI_MODEL_DEFAULT`, `getStoredGeminiModel()`, `getAiModelsCache()`. No Supabase.
*   **`src/components/layout/auth-provider.tsx`**: Wraps app in `SessionProvider` with `refetchOnWindowFocus={false}`.
*   **`src/app/api/settings/route.ts`**: GET returns `{ settings }`, PUT accepts partial updates and returns `{ success, settings }`; both require auth.
*   **`src/app/api/articles/`**, **`src/app/api/articles/[slug]/`**: Use Supabase for list/get/create/update/delete; return data in frontend shape via `articleToFrontend`.
*   **`src/app/api/images/`**, **`src/app/api/upload/`**: Use Supabase Storage for listing and uploading images.
*   **`src/app/api/ai/route.ts`**: Loads settings, builds system prompt prefix, applies default tone/length and allowed models; handles generate_article, improve_text, generate_metadata, extract_from_url, generate_image_prompt, discover_topics, generate_from_topic.
*   **`src/app/api/ai/image/route.ts`**: AI image generate/edit via Gemini 2.5 Flash Image (`@google/genai`); uses settings for prompt context. Env: `GEMINI_IMAGE_MODEL` (optional).
*   **`src/app/api/ai/image/save/route.ts`**: Accepts base64 image from client, uploads via `uploadImage` to Supabase Storage, returns `{ url }`.
*   **Article pages**: **`src/app/articles/new/page.tsx`** and **`src/app/articles/[slug]/page.tsx`** share the three-zone layout; Edit adds delete and draft status. Key components: **EditorToolbar**, **CollapsibleSection**, **ContentEditor**, **CoverImagePicker**, **AIToolsPanel**, **ArticleSettings**, **ArticlePreview**, **AIImageGenerator**. Save-draft handler uses optional event (`e?.preventDefault()`) for keyboard shortcut compatibility.
*   **`src/app/settings/page.tsx`**: Full settings UI (company, AI defaults including add-model and default model, AI instructions, link policy, categories/SEO, danger zone reset). Loads once per visit via ref to avoid losing input when switching windows.
*   **Auth**: NextAuth with existing config; session not refetched on window focus.
