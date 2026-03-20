"use client";

import { Shield } from "lucide-react";
import type { Ref } from "react";
import type { AppSettings } from "@/lib/settings-client";
import { TagInput } from "@/components/ui/TagInput";
import { FormField } from "./form-primitives";
import { SettingsSectionHeader } from "./SettingsSectionHeader";

export function AccessControlSection({
  form,
  update,
  sectionHeadingRef,
}: {
  form: Omit<AppSettings, "id">;
  update: (updates: Partial<Omit<AppSettings, "id">>) => void;
  sectionHeadingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <section
      id="settings-panel-access"
      role="tabpanel"
      aria-labelledby="settings-panel-access-heading"
      className="space-y-6"
    >
      <SettingsSectionHeader
        icon={Shield}
        title="Access Control"
        description="Only these Google account emails can sign in to the CMS. Add or remove addresses below."
        headingRef={sectionHeadingRef}
        id="settings-panel-access-heading"
      />
      <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/50 hover:border-slate-600/80 transition-colors space-y-4">
        <FormField label="Allowed emails" htmlFor="settings-allowed-emails-input">
          <TagInput
            inputId="settings-allowed-emails-input"
            values={form.allowed_login_emails}
            onChange={(v) => update({ allowed_login_emails: v })}
            placeholder="Add email (e.g. user@example.com)"
          />
        </FormField>
      </div>
    </section>
  );
}
