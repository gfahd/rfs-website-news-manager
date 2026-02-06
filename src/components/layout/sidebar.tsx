"use client";

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
  Shield,
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

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950">
      {/* Logo */}
      <div className="border-b border-slate-800 px-6 py-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-white">
              <span className="text-red-500">RED</span>FLAG
            </div>
            <div className="text-xs text-slate-500">Content Manager</div>
          </div>
        </Link>
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
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
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
          className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
