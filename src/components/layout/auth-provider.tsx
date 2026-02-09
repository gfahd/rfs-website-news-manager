"use client";

import { SessionProvider } from "next-auth/react";
import { ErrorProvider } from "@/context/ErrorContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ErrorProvider>{children}</ErrorProvider>
    </SessionProvider>
  );
}
