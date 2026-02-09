"use client";

import { ChevronDown } from "lucide-react";

export interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  open?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  open = true,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex justify-between items-center px-5 py-3 cursor-pointer hover:bg-slate-800/50 transition-all duration-200 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
