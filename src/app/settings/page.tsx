"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-slate-400 mt-1">
            Manage your account and preferences
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
          <SettingsIcon className="w-12 h-12 text-slate-500 mb-4" />
          <p className="text-slate-400">Settings page. Configure as needed.</p>
        </div>
      </main>
    </div>
  );
}
