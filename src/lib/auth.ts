import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getSettings } from "./settings";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.trim().toLowerCase();
      if (!email) return false;
      const settings = await getSettings();
      const allowed = Array.isArray(settings.allowed_login_emails) && settings.allowed_login_emails.length > 0
        ? settings.allowed_login_emails.map((e) => e.trim().toLowerCase()).filter(Boolean)
        : ["info@redflagsecurity.ca", "georges.fahd@gmail.com"];
      return allowed.includes(email);
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
