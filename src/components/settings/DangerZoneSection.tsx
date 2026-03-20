"use client";

import { AlertTriangle } from "lucide-react";
import type { Ref } from "react";
import { SettingsSectionHeader } from "./SettingsSectionHeader";

export function DangerZoneSection({
  onOpenResetModal,
  sectionHeadingRef,
}: {
  onOpenResetModal: () => void;
  sectionHeadingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <section
      id="settings-panel-danger"
      role="tabpanel"
      aria-labelledby="settings-panel-danger-heading"
      className="space-y-6"
    >
      <SettingsSectionHeader
        icon={AlertTriangle}
        title="Danger Zone"
        description="Destructive actions that affect all CMS settings."
        headingRef={sectionHeadingRef}
        id="settings-panel-danger-heading"
      />
      <div className="rounded-xl p-6 border border-red-900/50 bg-red-950/20 hover:border-red-800/60 transition-colors">
        <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" aria-hidden />
          Reset to defaults
        </h3>
        <p className="text-sm text-slate-400 mb-4">Reset all settings to default values. This cannot be undone.</p>
        <button
          type="button"
          onClick={onOpenResetModal}
          className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors min-h-[44px]"
        >
          Reset to Defaults
        </button>
      </div>
    </section>
  );
}
