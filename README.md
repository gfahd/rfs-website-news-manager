This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Google OAuth setup (fix "Error 401: invalid_client")

If you see **Access blocked: Authorization Error** or **Error 401: invalid_client** when signing in with Google:

1. **Create OAuth credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**.
   - Create a project or select one → **Create Credentials** → **OAuth client ID**.
   - If asked, configure the **OAuth consent screen** (External, add your email as test user).

2. **Create a Web application client**
   - Application type: **Web application**.
   - **Authorized redirect URIs** → Add:
     - `http://localhost:3000/api/auth/callback/google` (local)
     - For production: `https://admin.redflagsecurity.ca/api/auth/callback/google`

3. **Copy credentials into `.env.local`**
   - Replace the placeholders with the real values:
     - `GOOGLE_CLIENT_ID=` (paste your Client ID)
     - `GOOGLE_CLIENT_SECRET=` (paste your Client secret)
   - Restart the dev server (`npm run dev`).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
