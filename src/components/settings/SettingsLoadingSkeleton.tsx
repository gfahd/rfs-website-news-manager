"use client";

export function SettingsLoadingSkeleton() {
  return (
    <div className="w-full max-w-3xl space-y-6 animate-pulse" aria-busy="true" aria-label="Loading settings">
      <div className="h-10 w-48 rounded-lg bg-slate-800/80" />
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="h-14 bg-slate-800" />
        <div className="p-6 space-y-4 bg-slate-900/50">
          <div className="h-24 rounded-lg bg-slate-800/60" />
          <div className="h-10 rounded-lg bg-slate-800/60" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="h-10 rounded-lg bg-slate-800/60" />
            <div className="h-10 rounded-lg bg-slate-800/60" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 p-6 space-y-4">
        <div className="h-6 w-40 rounded bg-slate-800/80" />
        <div className="h-32 rounded-lg bg-slate-800/60" />
        <div className="h-24 rounded-lg bg-slate-800/60" />
      </div>
    </div>
  );
}
