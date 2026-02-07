# Automating Deployment to Verpex (FTP)

This guide explains how to make your website automatically build and upload to Verpex whenever you save an article in the Admin App.

You need to perform these steps on the **`rfs-website` repository** (the one that contains your public website code), NOT in this Admin repository.

---

## Step 1: Create the Workflow File

1.  Go to your **`rfs-website`** repository on GitHub.
2.  Click **Add file** > **Create new file**.
3.  Name the file: `.github/workflows/deploy.yml` (make sure to include the dot at the start).
4.  Paste the following code into the file:

```yaml
name: Build & Deploy to Verpex

on:
  push:
    branches:
      - main
      - master
    # This workflow runs whenever the Admin App (or you) pushes a change to the main branch.

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: 1. Checkout Code
        uses: actions/checkout@v4

      - name: 2. Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 3. Install Dependencies
        run: npm ci

      - name: 4. Build Website (Convert MD to HTML)
        run: npm run build
        env:
          # If your site needs the URL at build time, set it here
          NEXT_PUBLIC_SITE_URL: https://new.redflagsecurity.ca

      - name: 5. Deploy HTML to Verpex (FTP)
        uses: SamKirkland/FTP-Deploy-Action@v4.3.4
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./out/        # We upload the BUILT HTML folder
          server-dir: ./public_html/ # TARGET folder on Verpex (Check this!)
          # If your site is in a specific folder on Verpex (e.g. /news/), change server-dir to ./public_html/news/
```

5.  Click **Commit changes**.

---

## Step 2: Add FTP Secrets to GitHub

To allow GitHub to talk to Verpex securely, you need to save your FTP login details as "Secrets".

1.  In the **`rfs-website`** repo, go to **Settings**.
2.  On the left sidebar, click **Secrets and variables** > **Actions**.
3.  Click **New repository secret** for each of these:

| Name | Value (Example) |
|------|-----------------|
| `FTP_SERVER` | `ftp.verpex.com` (or your Shared IP Address from cPanel) |
| `FTP_USERNAME` | `your_cpanel_user` (or a specific FTP account user) |
| `FTP_PASSWORD` | `your_ftp_password` |

---

## Step 3: Verify `next.config.js`

Ensure your website is set up to generate static HTML files.

1.  Open `next.config.js` (or `next.config.ts`) in your **`rfs-website`** code.
2.  Make sure it includes `output: 'export'`:

```javascript
const nextConfig = {
  output: 'export', // <--- THIS IS CRITICAL
  // ... other config
};
```

If you change this, push the change to GitHub.

---

## Step 4: Test It

1.  Go to your **Admin App**.
2.  Create or Edit a news article and click **Save**.
3.  Go to the **Actions** tab in your **`rfs-website`** GitHub repo.
4.  You should see a new workflow run running (yellow circle).
5.  When it turns green (~2-3 minutes), check your live website. The new article should be there!
