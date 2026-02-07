# Why New Articles Don’t Show on the Live Site — and How to Fix It

## What’s going wrong

1. **This admin app** saves each article as a **single `.md` file** in the repo at `out/news/YYYY-MM-DD-slug.md` (e.g. `out/news/2026-02-06-redflag-security-doorbell-smart-protection-for-your-canadian-home.md`).
2. **The live website** (e.g. new.redflagsecurity.ca) is a **statically built** site. At **build time** it reads those `.md` files and generates **one folder per article** with `index.html` and Next.js assets inside (e.g. `out/news/redflag-security-doorbell.../index.html`).
3. When you publish from the admin, the new `.md` file is pushed to GitHub and may be synced to the server — so you see the `.md` file in the file manager. But the **HTML for that article was never generated**, because the main site hasn’t been rebuilt since you added the article. The live site only serves the static HTML that existed at the last build.

So: **the `.md` format is correct**. The missing step is **rebuilding and redeploying the main website** after new (or updated) content is in the repo.

---

## How does the main site (on your PC) get the .md files?

The **admin app** writes `.md` files to the **GitHub repo** (in the cloud). Your **main website** project lives **locally on your PC** and only sees files that are **on disk** in that project. So by default it “doesn’t know” about a new `.md` file until that file exists locally. You have two ways to fix that.

### Option 1: Same repo — pull, then build (simplest)

If the **main website** is a clone of the **same GitHub repo** that the admin writes to (same `GITHUB_OWNER` / `GITHUB_REPO`):

1. **Pull** the latest from GitHub so the new `.md` is on your PC:
   ```bash
   cd path/to/main-website-project
   git pull origin main
   ```
2. **Build** the main site. The build reads from the **local filesystem** (`out/news/*.md`), so it will now see the new file and generate `out/news/[slug]/index.html` for it:
   ```bash
   npm run build
   ```
3. **Deploy** the new build (e.g. upload the new `out/` to your server).

So: the main site doesn’t “change” the `.md` — it **reads** the `.md` (after you pull) and **outputs** static HTML. The flow is: **Admin pushes .md to GitHub → You pull in main site project → Build reads .md from disk → Build writes HTML → You deploy.**

### Option 2: Build fetches from GitHub at build time

If the main site is in a **different repo** or you don’t want to pull before every build, you can change the **main site’s build** so it **fetches** the list and content of `.md` files from the GitHub API (or from the repo’s raw URLs) when the build runs. Then the build always sees the latest content in GitHub and doesn’t depend on what’s on your disk. That requires changing the main site’s code (e.g. in `getStaticProps` / `generateStaticParams` or a build script) to call GitHub instead of reading `out/news/*.md` from the filesystem.

For most setups, **Option 1 (same repo, pull then build)** is the simplest: one repo, pull before build, then deploy.

---

## Answers to your questions

### 1. What format is better, and how do we save categories, slug, keywords?

**Markdown (`.md`) with YAML front matter is the right format** and is what this admin already uses.

- **Categories, slug, keywords, etc.** are stored in the **front matter** at the top of each file (between `---` lines). The admin already writes: `title`, `excerpt`, `category`, `publishedAt`, `coverImage`, `tags`, `seoKeywords`, `author`, `featured`, `draft`. The **slug** is derived from the filename (date prefix removed). No extra system is needed.

### 2. How are articles saved differently — build vs admin?

- **This admin app** (redflag-news-admin) is the only thing that **creates/updates/deletes** article files. It writes **only** the `.md` files to the repo (`out/news/*.md`) and images to `public/images/news/`.
- The **main website** does **not** write articles. Its **build process** **reads** the `.md` files and **outputs** the static site (e.g. `out/news/[slug]/index.html`). So:
  - **Admin** → writes `.md` (and images) to the repo.
  - **Main site build** → reads `.md` and generates the HTML the live site actually serves.

### 3. What’s a solid, robust solution?

The robust approach is:

1. **Keep** storing articles as `.md` with front matter (as now).
2. **Always rebuild and redeploy the main website** after content changes (new/edited/deleted articles or images).

That way the live site’s static output always matches the content in the repo.

---

## What you need to do

### Option A: Rebuild and redeploy the main site (required at least once)

You need to run the **main website’s** build (the Next.js app that has the `/news` pages and reads `out/news/*.md`), then upload or deploy the new **output** (the whole `out/` tree, including the new `out/news/[slug]/` folders) to your server.

- If you build locally: run that project’s `npm run build` (or equivalent), then upload the generated `out/` (or `build/`) to the server (e.g. replace the contents of the `news` directory on cPanel with the new `out/news` contents).
- If you use a CI/CD (e.g. GitHub Actions): trigger a build that reads from the same repo/branch, then deploys the new static output to new.redflagsecurity.ca.

After that, **whenever you add or change an article from this admin**, run the same rebuild + deploy again so the new article gets its own folder and `index.html`.

### Option B: Automate rebuilds (recommended)

So you don’t have to remember to rebuild:

1. **Same repo as main site**  
   If the main site lives in the same GitHub repo (e.g. in a subfolder or the repo root), configure your deployment so that **every push to `main`** (including pushes from this admin) runs the main site’s build and deploys the result. Then publishing from the admin automatically updates the live site after the next deploy.

2. **Different repo or manual deploy**  
   - Use a **GitHub Action** in the repo that contains the content (or the main site) to run the main site build and deploy on push to `main`, or  
   - Use a **webhook** or scheduled job that pulls the repo, runs the build, and uploads the output to the server.

Once this is in place, the flow is: **Admin saves article → content is in repo → build runs → new HTML is deployed → article appears on the live site.**

---

## Quick checklist (same-repo, local main site)

- [ ] In the **main website** project folder (same repo the admin writes to), run **`git pull origin main`** so the new `.md` file is on your PC.
- [ ] Run the **main website’s** build (`npm run build` or equivalent) so it reads the .md files and produces `out/news/[slug]/index.html` for each article.
- [ ] **Deploy** the built output (e.g. upload the new `out/` or `out/news/`) to your server.
- [ ] (Optional) Set up **automatic** pull + build + deploy (e.g. GitHub Actions) so future articles show up without manual steps.

The admin app is doing its job: it’s saving the correct `.md` (and images) to the repo. The remaining fix is always rebuilding and redeploying the main site when content changes.
