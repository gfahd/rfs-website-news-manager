"use client";

import type { ReactNode } from "react";

export const inputClassName =
  "w-full bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-colors";

export const textareaClassName = `${inputClassName} resize-y`;

export const selectClassName = inputClassName;

export function FormField({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-300 block">
        {label}
      </label>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      {children}
    </div>
  );
}

export function SubCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/50 hover:border-slate-600/80 transition-colors space-y-4">
      {title ? (
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}

type ToggleProps = {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  id?: string;
};

/** Slate/red theme toggles for CMS settings (if needed). */
export function SettingsToggle({ checked, onToggle, disabled, id }: ToggleProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/60 focus:ring-offset-slate-950 disabled:opacity-60 ${
          checked ? "bg-red-600" : "bg-slate-600"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-xs font-medium text-slate-400 tabular-nums min-w-[1.75rem]" aria-hidden>
        {checked ? "On" : "Off"}
      </span>
    </div>
  );
}
