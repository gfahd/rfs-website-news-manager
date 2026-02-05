# Red Flag Security — News Admin App
## Complete Build & Deployment Guide

---

# TABLE OF CONTENTS

1. [Overview](#overview)
2. [Phase 1: GitHub Actions Auto-Deploy](#phase-1-github-actions-auto-deploy)
3. [Phase 2: Create Admin App Project](#phase-2-create-admin-app-project)
4. [Phase 3: Deploy to Vercel](#phase-3-deploy-to-vercel)
5. [Phase 4: Configure Domain](#phase-4-configure-domain)
6. [Phase 5: Usage Guide](#phase-5-usage-guide)
7. [Managing Allowed Users](#managing-allowed-users)
8. [Troubleshooting](#troubleshooting)

---

# OVERVIEW

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│   ADMIN (Any Device)                                            │
│   admin.redflagsecurity.ca                                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│   VERCEL (Free)                                                  │
│   Hosts Admin App                                                │
│   • Google Login                                                 │
│   • Email whitelist                                              │
│   • Article editor                                               │
│   • Image upload                                                 │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│   GITHUB                                                         │
│   • Stores articles (content/news/)                             │
│   • Stores images (public/images/news/)                         │
│   • Triggers auto-deploy                                         │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│   GITHUB ACTIONS                                                 │
│   • Builds website                                               │
│   • FTP uploads to Verpex                                        │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│   VERPEX                                                         │
│   redflagsecurity.ca (Live Website)                             │
└──────────────────────────────────────────────────────────────────┘
```

---

# PHASE 1: GITHUB ACTIONS AUTO-DEPLOY

This makes your main website auto-deploy whenever content changes.

## Step 1.1: Get Your Verpex FTP Credentials

1. Log into Verpex cPanel
2. Go to **FTP Accounts**
3. Note down (or create new FTP account):
   - **Host:** Usually `ftp.redflagsecurity.ca` or server IP
   - **Username:** Your FTP username
   - **Password:** Your FTP password
   - **Path:** `/public_html/redflagsecurity.ca` (or wherever your site lives)

## Step 1.2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these 4 secrets:

| Secret Name | Value |
|-------------|-------|
| `FTP_HOST` | Your FTP host (e.g., `ftp.redflagsecurity.ca`) |
| `FTP_USERNAME` | Your FTP username |
| `FTP_PASSWORD` | Your FTP password |
| `FTP_PATH` | Remote path (e.g., `/public_html/redflagsecurity.ca`) |

## Step 1.3: Create GitHub Actions Workflow

Create this file in your main website repo:

**File:** `.github/workflows/deploy.yml`

```yaml
name: Build and Deploy to Verpex

on:
  push:
    branches:
      - main
  workflow_dispatch:  # Allows manual trigger

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      # Step 1: Checkout code
      - name: Checkout repository
        uses: actions/checkout@v4

      # Step 2: Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # Step 3: Install dependencies
      - name: Install dependencies
        run: npm ci

      # Step 4: Build the site
      - name: Build static site
        run: npm run build

      # Step 5: Deploy via FTP
      - name: Deploy to Verpex via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.FTP_HOST }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./out/
          server-dir: ${{ secrets.FTP_PATH }}/
          dangerous-clean-slate: false

      # Step 6: Notify completion
      - name: Deployment complete
        run: echo "✅ Site deployed successfully to Verpex!"
```

## Step 1.4: Test the Auto-Deploy

1. Commit and push the workflow file
2. Go to GitHub → **Actions** tab
3. Watch the workflow run
4. Check your live site after ~2-3 minutes

---

# PHASE 2: CREATE ADMIN APP PROJECT

## Step 2.1: Create New Project

Open terminal and run:

```bash
# Create new Next.js app
npx create-next-app@latest redflag-news-admin

# Answer the prompts:
# ✔ Would you like to use TypeScript? Yes
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use Tailwind CSS? Yes
# ✔ Would you like to use `src/` directory? Yes
# ✔ Would you like to use App Router? Yes
# ✔ Would you like to customize the default import alias? No

# Navigate to project
cd redflag-news-admin
```

## Step 2.2: Install Dependencies

```bash
npm install next-auth @auth/core
npm install @octokit/rest
npm install lucide-react
npm install @tailwindcss/typography
npm install react-markdown
npm install gray-matter
npm install --save-dev @types/node
```

## Step 2.3: Project Structure

Create this file structure:

```
redflag-news-admin/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   ├── articles/
│   │   │   │   ├── route.ts
│   │   │   │   └── [slug]/
│   │   │   │       └── route.ts
│   │   │   └── upload/
│   │   │       └── route.ts
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── articles/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── media/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── auth-provider.tsx
│   │   ├── articles/
│   │   │   ├── article-form.tsx
│   │   │   ├── article-list.tsx
│   │   │   └── article-card.tsx
│   │   ├── editor/
│   │   │   └── markdown-editor.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── card.tsx
│   │       └── badge.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── github.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── .env.local
├── next.config.js
└── package.json
```

---

## Step 2.4: Core Files

### File: `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/layout/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Red Flag Security - Content Manager",
  description: "News & Insights Admin Panel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-900 text-slate-100`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### File: `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 15 23 42;
  --foreground: 248 250 252;
  --primary: 220 38 38;
  --primary-foreground: 255 255 255;
  --card: 30 41 59;
  --card-foreground: 248 250 252;
  --border: 51 65 85;
  --input: 51 65 85;
  --ring: 220 38 38;
}

body {
  background-color: rgb(var(--background));
  color: rgb(var(--foreground));
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgb(30 41 59);
}

::-webkit-scrollbar-thumb {
  background: rgb(71 85 105);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(100 116 139);
}
```

### File: `src/lib/auth.ts`

```typescript
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Add allowed emails here
const ALLOWED_EMAILS = [
  "admin@redflagsecurity.ca",
  "office@redflagsecurity.ca",
  // Add more emails as needed
];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Check if user's email is in allowed list
      if (user.email && ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
        return true;
      }
      // Deny access
      return false;
    },
    async session({ session, token }) {
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
```

### File: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### File: `src/components/layout/auth-provider.tsx`

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### File: `src/app/page.tsx` (Login Page)

```tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield, LogIn } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/20 mb-4">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-red-500">RED</span>FLAG SECURITY
            </h1>
            <p className="text-slate-400 mt-2">Content Manager</p>
          </div>

          {/* Login Button */}
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 rounded-lg px-4 py-3 font-medium hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          {/* Notice */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Access restricted to authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
```

### File: `src/components/layout/sidebar.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Image,
  Settings,
  LogOut,
  Plus,
  Shield,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Articles", href: "/articles", icon: FileText },
  { name: "Media", href: "/media", icon: Image },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col w-64 bg-slate-800 border-r border-slate-700">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm">
              <span className="text-red-500">RED</span>FLAG
            </div>
            <div className="text-xs text-slate-400">Content Manager</div>
          </div>
        </Link>
      </div>

      {/* New Article Button */}
      <div className="p-4">
        <Link
          href="/articles/new"
          className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2.5 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Article
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          {session?.user?.image && (
            <img
              src={session.user.image}
              alt=""
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {session?.user?.name}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {session?.user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
```

### File: `src/app/dashboard/page.tsx`

```tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  FileText,
  Eye,
  Calendar,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await fetch("/api/articles");
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchArticles();
    }
  }, [session]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Articles",
      value: articles.length,
      icon: FileText,
      color: "bg-blue-600",
    },
    {
      name: "Published",
      value: articles.filter((a: any) => !a.draft).length,
      icon: Eye,
      color: "bg-green-600",
    },
    {
      name: "Drafts",
      value: articles.filter((a: any) => a.draft).length,
      icon: Calendar,
      color: "bg-yellow-600",
    },
    {
      name: "Featured",
      value: articles.filter((a: any) => a.featured).length,
      icon: TrendingUp,
      color: "bg-red-600",
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {session.user?.name?.split(" ")[0]}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/articles/new"
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-red-500/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                <Plus className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">New Article</div>
                <div className="text-sm text-slate-400">
                  Create a new news article
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
            </div>
          </Link>

          <Link
            href="/media"
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-red-500/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                <Eye className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Media Library</div>
                <div className="text-sm text-slate-400">
                  Manage images and files
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </Link>
        </div>

        {/* Recent Articles */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold">Recent Articles</h2>
            <Link
              href="/articles"
              className="text-sm text-red-500 hover:text-red-400"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No articles yet.{" "}
              <Link href="/articles/new" className="text-red-500">
                Create your first one!
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {articles.slice(0, 5).map((article: any) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{article.title}</div>
                    <div className="text-sm text-slate-400">
                      {article.category} • {article.publishedAt}
                    </div>
                  </div>
                  {article.featured && (
                    <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded">
                      Featured
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```

### File: `src/lib/github.ts`

```typescript
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OWNER = process.env.GITHUB_OWNER!; // Your GitHub username
const REPO = process.env.GITHUB_REPO!; // Your repo name (e.g., "secure-foundation")
const BRANCH = "main";

export async function getArticles() {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: "content/news",
      ref: BRANCH,
    });

    if (!Array.isArray(data)) {
      return [];
    }

    const articles = await Promise.all(
      data
        .filter((file: any) => file.name.endsWith(".md") && !file.name.startsWith("_"))
        .map(async (file: any) => {
          const content = await getFileContent(file.path);
          return parseArticle(file.name, content);
        })
    );

    return articles.sort((a, b) => 
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

  if ("content" in data) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  return "";
}

export async function saveArticle(
  slug: string,
  content: string,
  message: string
) {
  const path = `content/news/${slug}.md`;

  // Check if file exists
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
  } catch (error) {
    // File doesn't exist, that's okay
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
  const path = `content/news/${slug}.md`;

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
  content: string, // base64
  mimeType: string
) {
  const path = `public/images/news/${filename}`;

  // Check if file exists
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
  } catch (error) {
    // File doesn't exist
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path,
    message: `Upload image: ${filename}`,
    content: content, // Already base64
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
      .filter((file: any) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
      .map((file: any) => ({
        name: file.name,
        path: `/images/news/${file.name}`,
        size: file.size,
        url: file.download_url,
      }));
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
}

function parseArticle(filename: string, content: string) {
  const matter = require("gray-matter");
  const { data, content: body } = matter(content);

  // Extract slug from filename (remove date prefix and .md)
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
    author: data.author || "Red Flag Security Team",
    featured: data.featured || false,
    content: body,
  };
}
```

### File: `src/app/api/articles/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getArticles, saveArticle } from "@/lib/github";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await getArticles();
  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    excerpt,
    category,
    publishedAt,
    coverImage,
    tags,
    featured,
    content,
  } = body;

  // Generate filename
  const date = new Date(publishedAt).toISOString().split("T")[0];
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${date}-${slug}`;

  // Build markdown content
  const markdown = `---
title: "${title}"
excerpt: "${excerpt}"
category: "${category}"
publishedAt: "${publishedAt}"
coverImage: "${coverImage || ""}"
tags: [${tags.map((t: string) => `"${t}"`).join(", ")}]
author: "Red Flag Security Team"
featured: ${featured || false}
---

${content}
`;

  await saveArticle(filename, markdown, `Add article: ${title}`);

  return NextResponse.json({ success: true, slug: filename });
}
```

### File: `.env.local` (Create this file)

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-string-here-make-it-long

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_OWNER=your-github-username
GITHUB_REPO=secure-foundation
```

---

# PHASE 3: DEPLOY TO VERCEL

## Step 3.1: Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial admin app"

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/redflag-news-admin.git

# Push
git push -u origin main
```

## Step 3.2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your `redflag-news-admin` repository
4. Vercel auto-detects Next.js settings
5. Add **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `https://admin.redflagsecurity.ca` |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GITHUB_TOKEN` | Your GitHub PAT |
| `GITHUB_OWNER` | Your GitHub username |
| `GITHUB_REPO` | `secure-foundation` |

6. Click **Deploy**

## Step 3.3: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://admin.redflagsecurity.ca/api/auth/callback/google` (prod)
7. Copy Client ID and Client Secret to Vercel env vars

## Step 3.4: Create GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select scopes:
   - `repo` (full control)
4. Copy token to Vercel env vars

---

# PHASE 4: CONFIGURE DOMAIN

## Step 4.1: Add Domain in Vercel

1. In Vercel project settings → **Domains**
2. Add: `admin.redflagsecurity.ca`
3. Vercel will show DNS records needed

## Step 4.2: Configure DNS in Verpex

1. Log into Verpex cPanel
2. Go to **Zone Editor** or **DNS Management**
3. Add CNAME record:
   - **Name:** `admin`
   - **Type:** `CNAME`
   - **Value:** `cname.vercel-dns.com`
4. Wait 5-10 minutes for propagation

## Step 4.3: Verify

Visit `https://admin.redflagsecurity.ca` — should show your admin app!

---

# PHASE 5: USAGE GUIDE

## For Your Office Admin

### Logging In

1. Go to `admin.redflagsecurity.ca`
2. Click **"Sign in with Google"**
3. Use your `@redflagsecurity.ca` Google account
4. You're in!

### Creating an Article

1. Click **"+ New Article"** in sidebar
2. Fill in:
   - **Title**: The headline
   - **Summary**: Short description (shows in previews)
   - **Category**: Select from dropdown
   - **Cover Image**: Upload or select existing
   - **Content**: Write your article
   - **Tags**: Add keywords (optional)
   - **Featured**: Check to make it the main article
3. Click **"Publish"**
4. Article goes live in ~3 minutes!

### Editing an Article

1. Go to **Articles** in sidebar
2. Click on the article to edit
3. Make changes
4. Click **"Update"**

### Deleting an Article

1. Go to **Articles**
2. Click the article
3. Click **"Delete"** (bottom of page)
4. Confirm deletion

### Managing Images

1. Go to **Media** in sidebar
2. Upload new images by drag & drop
3. Copy image path to use in articles

---

# MANAGING ALLOWED USERS

## Adding New Users

Edit `src/lib/auth.ts`:

```typescript
const ALLOWED_EMAILS = [
  "admin@redflagsecurity.ca",
  "office@redflagsecurity.ca",
  "newperson@redflagsecurity.ca",  // Add new email
];
```

Then redeploy on Vercel (automatic on push).

## Removing Users

Simply remove their email from the list and redeploy.

---

# TROUBLESHOOTING

## "Access Denied" on Login

- Check email is in `ALLOWED_EMAILS` list
- Email must match exactly (lowercase)
- Redeploy after changing list

## Articles Not Appearing

- Check GitHub Actions completed successfully
- Wait 2-3 minutes for deploy
- Check browser cache (hard refresh: Ctrl+Shift+R)

## Images Not Uploading

- Check file size (max 5MB recommended)
- Check file type (JPG, PNG, WebP, GIF only)
- Check GitHub token has `repo` permissions

## Build Failing

- Check GitHub Actions logs for errors
- Verify all environment variables are set
- Check for syntax errors in markdown files

---

# QUICK REFERENCE

| Task | Action |
|------|--------|
| Access admin | `admin.redflagsecurity.ca` |
| New article | Sidebar → + New Article |
| Edit article | Articles → Click article |
| Upload image | Media → Drag & drop |
| Add user | Edit `ALLOWED_EMAILS` in auth.ts |
| View live site | `redflagsecurity.ca/news` |
| Check deploy status | GitHub → Actions tab |

---

**Document Created:** February 4, 2026
**System:** Red Flag Security News Admin
**Version:** 1.0
