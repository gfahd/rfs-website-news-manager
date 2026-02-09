"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Articles", href: "/articles", icon: FileText },
  { name: "New Article", href: "/articles/new", icon: PenSquare },
  { name: "Media", href: "/media", icon: Image },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-slate-800 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay — only when sidebar open on mobile */}
      {sidebarOpen && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
          aria-hidden
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-slate-800 bg-slate-950 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo + close (mobile) */}
        <div className="border-b border-slate-800 px-6 py-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="block transition-opacity hover:opacity-90"
            onClick={closeSidebar}
          >
            <img
              src="/red-flag-security-logo.webp"
              alt="Red Flag Security"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <button
            type="button"
            onClick={closeSidebar}
            className="md:hidden p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigation.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] ${
                  isActive
                    ? "bg-red-500/10 text-red-500"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-3">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-slate-300">
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">
                {session?.user?.name}
              </div>
              <div className="truncate text-xs text-slate-500">
                {session?.user?.email}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-white min-h-[44px]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
