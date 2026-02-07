# Red Flag News Admin — Workflow & System Guide

This document describes what the app does, which tools it uses, which settings it needs, and how data flows. Use it so an AI or developer can understand the workflow and work on the app correctly.

---

## 1. What This App Does

**Red Flag News Admin** is a **content management (admin) panel** for the Red Flag Security news/blog. It lets authorized users:

- **Sign in** with Google (allowlist of emails only).
- **Manage articles** stored as **Markdown files in a GitHub repo** (list, create, edit, delete).
- **Manage images** used in articles: upload to the same repo and pick from existing ones when editing articles.
- **View a dashboard** with article counts and quick links.

There is **no database**. All content lives in **GitHub**: articles under `content/news/*.md`, images under `public/images/news/`. The app is the UI and API layer that reads/writes that repo via the GitHub API.

**Live website:** The public site (e.g. new.redflagsecurity.ca) is a **static** deployment. It serves pre-built HTML under `news/[slug]/` (one folder per article). That HTML is generated at **build time** from the same repo’s `content/news/*.md` files. So when you add or edit an article from this admin, the new `.md` is in the repo, but the live site will **not** show the new article until the main site is **rebuilt and redeployed**. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for why new articles don’t appear and how to fix it (rebuild + deploy, and optional automation).

---

## 2. Tech Stack & Tools

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 16** (App Router) |
| Language | **TypeScript** |
| Auth | **NextAuth v4** with **Google OAuth** |
| GitHub | **@octokit/rest** (GitHub API client) |
| Markdown | **gray-matter** (frontmatter + body), **react-markdown** (if used for preview) |
| UI | **React 19**, **Tailwind CSS 4**, **lucide-react** icons |
| Lint | **ESLint** (eslint-config-next) |

- **Path alias**: `@/*` → `./src/*` (see `tsconfig.json`).

---

## 3. Settings & Environment

All config is via **environment variables**. Use a `.env.local` in the project root (never commit secrets).

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token (repo read/write) |
| `GITHUB_OWNER` | Yes | GitHub org or user (e.g. `myorg`) |
| `GITHUB_REPO` | Yes | Repo name (e.g. `redflag-news`) |
| `NEXTAUTH_URL` | Yes (prod) | Full app URL (e.g. `https://admin.redflagsecurity.ca`) |
| `NEXTAUTH_SECRET` | Yes (prod) | Secret for signing sessions |

- **Auth allowlist**: Allowed Google emails are hardcoded in `src/lib/auth.ts` in the `ALLOWED_EMAILS` array. To add users, add emails there.
- **GitHub branch**: The app uses the `main` branch (see `BRANCH` in `src/lib/github.ts`).

---

## 4. Project Structure (High Level)

```
src/
├── app/
│   ├── layout.tsx              # Root layout, dark theme, AuthProvider
│   ├── page.tsx                 # Login (/) — sign in with Google
│   ├── dashboard/page.tsx       # Dashboard after login
│   ├── articles/
│   │   ├── page.tsx             # List articles, search, filter, delete
│   │   ├── new/page.tsx         # Create article form
│   │   └── [slug]/page.tsx      # Edit article form (load by slug)
│   ├── media/page.tsx           # Media library (list images from repo)
│   ├── settings/page.tsx        # Settings (placeholder)
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│       ├── articles/route.ts             # GET list, POST create
│       ├── articles/[slug]/route.ts       # GET one, PUT update, DELETE
│       ├── images/route.ts               # GET list of images
│       └── upload/route.ts               # POST upload image (base64)
├── components/layout/
│   ├── auth-provider.tsx        # SessionProvider wrapper
│   └── sidebar.tsx              # Nav + user + sign out
└── lib/
    ├── auth.ts                  # NextAuth config, Google provider, ALLOWED_EMAILS
    └── github.ts                # All GitHub operations (articles, images)
```

---

## 5. Authentication Flow

1. **Unauthenticated**  
   - User hits `/` (login page).  
   - Clicks “Sign in with Google” → NextAuth redirects to Google.  
   - On return, `signIn` callback in `src/lib/auth.ts` checks `user.email` against `ALLOWED_EMAILS`.  
   - If allowed → session created, redirect to `/dashboard`.  
   - If not → access denied, stays on `/`.

2. **Authenticated**  
   - All dashboard/articles/media/settings pages check `useSession()`.  
   - If `status === "unauthenticated"` they redirect to `/`.  
   - All API routes (articles, images, upload) use `getServerSession(authOptions)` and return 401 if no session.

3. **Sign out**  
   - Sidebar “Sign out” calls `signOut()` from `next-auth/react`.

---

## 6. Data & Workflow

### 6.1 Where Content Lives (GitHub)

- **Articles**: `content/news/<filename>.md`.  
  - Filename format: `YYYY-MM-DD-<slug>.md` (e.g. `2025-02-05-my-article.md`).  
  - Slug is derived by stripping date prefix and `.md`.  
  - File = YAML frontmatter + Markdown body (parsed with `gray-matter` in `src/lib/github.ts`).  
  - **Categories, slug, keywords, etc.** live in the frontmatter; no separate store is needed.

- **Who saves what**: Only **this admin app** writes article `.md` files and images to the repo. The **main (public) website** does not write content; its **build** reads `.md` and generates static HTML (`news/[slug]/index.html`). New articles appear on the live site only after the main site is **rebuilt and redeployed** — see [DEPLOYMENT.md](./DEPLOYMENT.md).

- **Images**: `public/images/news/<filename>`.  
  - Uploaded as base64 via GitHub API; filenames get a timestamp prefix to avoid collisions.

### 6.2 Article Shape (Frontmatter + Body)

From `src/lib/github.ts` and the API routes, each article has:

- **Frontmatter**: `title`, `excerpt`, `category`, `publishedAt`, `coverImage`, `tags` (array), `author` (fixed “Red Flag Security Team”), `featured` (boolean).  
- **Body**: Raw Markdown (content).

Categories used in the UI: `threat-intel`, `technology`, `company-news`, `guides`.

### 6.3 API Usage (from the app’s own UI)

- **GET /api/articles**  
  - Fetches all articles from GitHub (`getArticles()`), returns `{ articles }`.  
  - Used by: Dashboard, Articles list.

- **POST /api/articles**  
  - Body: `title`, `excerpt`, `category`, `publishedAt`, `coverImage`, `tags`, `featured`, `content`.  
  - Builds slug from title, filename as `YYYY-MM-DD-<slug>.md`, builds markdown with frontmatter, calls `saveArticle()`.  
  - Returns `{ success: true, slug }`.  
  - Used by: New article page.

- **GET /api/articles/[slug]**  
  - Returns single article or 404.  
  - Used by: Edit article page.

- **PUT /api/articles/[slug]**  
  - Same body as POST.  
  - Keeps existing filename when updating (so date in filename doesn’t change).  
  - Used by: Edit article page.

- **DELETE /api/articles/[slug]**  
  - Resolves article to get filename, then deletes that file in GitHub.  
  - Used by: Articles list (row delete), Edit page (Delete button).

- **GET /api/images**  
  - Lists images in `public/images/news` from GitHub.  
  - Returns `{ images }` (name, path, size, url).  
  - Used by: Media page, New/Edit article (image picker).

- **POST /api/upload**  
  - Body: `filename`, `content` (base64), `mimeType`.  
  - Sanitizes filename, adds timestamp prefix, calls `uploadImage()` in `github.ts`.  
  - Returns `{ path, filename }`.  
  - Used by: New/Edit article (cover image upload).

All these API routes require an authenticated session (NextAuth); otherwise they return 401.

### 6.4 Page Flows (User Workflow)

1. **Login** → `/` → Google → allowlist check → redirect to `/dashboard`.  
2. **Dashboard** → Shows article stats, “New Article”, “Media Library”, recent articles (from `/api/articles`).  
3. **Articles list** → `/articles` → Fetch `/api/articles`, search/filter by category, link to edit, delete via `DELETE /api/articles/[slug]`.  
4. **New article** → `/articles/new` → Form; cover image: upload (POST `/api/upload`) or pick from `/api/images`; submit → POST `/api/articles` → redirect to `/articles`.  
5. **Edit article** → `/articles/[slug]` → GET `/api/articles/[slug]`, same form as new; submit → PUT `/api/articles/[slug]`; delete → DELETE then redirect to `/articles`.  
6. **Media** → `/media` → GET `/api/images`, display grid (read-only list).  
7. **Settings** → `/settings` → Placeholder only.

---

## 7. Conventions for AI / Developers

- **Auth**: Any new protected page or API must check session (client: `useSession`, server: `getServerSession(authOptions)`).  
- **Content**: Do not add a database for articles/images; they live in GitHub.  
- **Articles**: Use `src/lib/github.ts` for all GitHub reads/writes; keep frontmatter fields in sync with the types used in the API (title, excerpt, category, publishedAt, coverImage, tags, featured, content).  
- **Slug vs filename**: Slug is used in URLs and API routes; filename in repo is `YYYY-MM-DD-<slug>.md`. When updating, preserve the existing filename (and thus date).  
- **Images**: Upload via `/api/upload` (base64); stored in repo at `public/images/news/`. Cover image in frontmatter is stored as a path like `/images/news/<filename>`.  
- **Env**: Never hardcode `GITHUB_TOKEN`, Google secrets, or `NEXTAUTH_SECRET`. Use `.env.local` and document new vars in this file.  
- **UI**: App is dark (e.g. `bg-slate-900`, `slate-800`), accent red (`red-600`). Sidebar on all internal pages; layout uses `Sidebar` + main content.  
- **Scripts**: `npm run dev` (development), `npm run build` / `npm run start` (production), `npm run lint` (ESLint).

---

## 8. Quick Reference: Where to Change What

| Change | Location |
|--------|----------|
| Allowed login emails | `src/lib/auth.ts` → `ALLOWED_EMAILS` |
| GitHub repo/branch | `src/lib/github.ts` → `OWNER`, `REPO`, `BRANCH` |
| Article frontmatter fields | `src/lib/github.ts` (`parseArticle`, `saveArticle`), API routes that build markdown |
| Categories list | Articles list + New/Edit article pages (categories arrays) |
| New API route | Under `src/app/api/`, use `getServerSession(authOptions)` for auth |
| New protected page | Use `useSession()`, redirect if unauthenticated; use `<Sidebar />` for layout |

This workflow document is the single place to understand what the app does, what tools and settings it uses, and how to extend or modify it consistently.
