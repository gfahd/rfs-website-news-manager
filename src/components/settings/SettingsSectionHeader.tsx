"use client";

import type { LucideIcon } from "lucide-react";
import type { Ref } from "react";

export function SettingsSectionHeader({
  icon: Icon,
  title,
  description,
  headingRef,
  id,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  headingRef?: Ref<HTMLHeadingElement>;
  id?: string;
}) {
  return (
    <header className="space-y-2 mb-6">
      <h2
        id={id}
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-semibold text-white flex flex-wrap items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 rounded"
      >
        <Icon className="w-6 h-6 text-slate-400 shrink-0" aria-hidden />
        {title}
      </h2>
      {description ? <p className="text-sm text-slate-400 max-w-2xl">{description}</p> : null}
    </header>
  );
}
