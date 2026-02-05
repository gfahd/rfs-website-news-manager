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
