# Red Flag News Admin - Application Summary

This document provides a technical overview of the Red Flag News Admin application, specifically designed to help an AI agent understand the architecture, data flow, and deployment model.

## 1. Application Overview
**Red Flag News Admin** is a bespoke Content Management System (CMS) built with **Next.js**. It is used to manage news articles for a separate public-facing **static website** (Red Flag Security).

*   **Role**: Admin Interface.
*   **Target**: Updates content in a GitHub repository.
*   **Database**: None. The GitHub repository acts as the database.

## 2. Technology Stack
*   **Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS 4
*   **Authentication**: NextAuth.js (Google OAuth, restricted to specific email domains)
*   **Data Layer**: GitHub API (via `@octokit/rest`)
*   **Content Format**: Markdown (`.md`) with YAML Frontmatter
*   **State Management**: Server Actions / API Routes

## 3. Data Storage & Structure
The application treats a GitHub repository as its file system.

### Articles
*   **Location**: `content/news/` in the target repository.
*   **File Format**: Markdown (`.md`).
*   **Naming Convention**: `YYYY-MM-DD-slug.md` (e.g., `2024-03-20-security-update.md`).
*   **Content Structure**:
    *   **Frontmatter (YAML)**: Stores metadata like `title`, `excerpt`, `category`, `publishedAt`, `coverImage`, `tags`, `author`, `featured`.
    *   **Body**: Standard Markdown content.
*   **Logic**: Handled in `src/lib/github.ts`.

### Images
*   **Location**: `public/images/news/` in the target repository.
*   **Upload Method**: Files are converted to Base64 and committed via the GitHub API.
*   **Serving**: Referenced in articles by their public path (e.g., `/images/news/my-image.jpg`).

## 4. Workflow & Deployment (CRITICAL)
Understanding the decoupling between this Admin App and the Public Site is essential.

1.  **Content Creation**:
    *   User logs into **Red Flag News Admin**.
    *   User creates/edits an article.
    *   Admin App pushes a commit to the GitHub repository (adding/updating the `.md` file).

2.  **The "Disconnect"**:
    *   At this stage, the **Public Website** (a static site) does **NOT** automatically update.
    *   The public site serves pre-generated HTML files created during its last *build*.

3.  **Deployment/Update Process**:
    *   To make the new article visible, the **Public Website must be rebuilt and redeployed**.
    *   **Build Process**: The public site's build script (e.g., `next build`) scans the `content/news/` folder, parses the `.md` files, and generates static HTML pages (e.g., `out/news/slug/index.html`).
    *   **Trigger**: This usually requires a manual trigger or a CI/CD pipeline (e.g., GitHub Actions) configured to watch for changes in `content/news/`.

## 5. Key Environment Variables
The app relies on these secrets (stored in `.env.local`):
*   `GITHUB_TOKEN`: Token with repo read/write permissions.
*   `GITHUB_OWNER`: The GitHub organization/username.
*   `GITHUB_REPO`: The repository name where content is stored.
*   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: For authentication.

## 6. Codebase Context
*   **`src/lib/github.ts`**: The "Backend" service. Contains `getArticles`, `saveArticle`, `deleteArticle`, `uploadImage`. This is the single point of truth for GitHub interactions.
*   **`src/app/api/`**: Internal API endpoints called by the frontend to execute the server-side GitHub logic.
