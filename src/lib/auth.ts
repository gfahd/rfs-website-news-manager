import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Add allowed emails here
const ALLOWED_EMAILS = [
  "info@redflagsecurity.ca",
  "georges.fahd@gmail.com",
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
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
