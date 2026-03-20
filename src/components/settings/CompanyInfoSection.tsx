"use client";

import { Building2 } from "lucide-react";
import type { Ref } from "react";
import type { AppSettings } from "@/lib/settings-client";
import { FormField, inputClassName, textareaClassName } from "./form-primitives";
import { SettingsSectionHeader } from "./SettingsSectionHeader";

export function CompanyInfoSection({
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
      id="settings-panel-company"
      role="tabpanel"
      aria-labelledby="settings-panel-company-heading"
      className="space-y-6"
    >
      <SettingsSectionHeader
        icon={Building2}
        title="Company Info"
        description="Basic company details used across the CMS and content."
        headingRef={sectionHeadingRef}
        id="settings-panel-company-heading"
      />
      <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/50 hover:border-slate-600/80 transition-colors space-y-4">
        <FormField label="Company Name" htmlFor="settings-company-name">
          <input
            id="settings-company-name"
            type="text"
            value={form.company_name}
            onChange={(e) => update({ company_name: e.target.value })}
            className={inputClassName}
          />
        </FormField>
        <FormField label="Company Description" htmlFor="settings-company-desc">
          <textarea
            id="settings-company-desc"
            value={form.company_description}
            onChange={(e) => update({ company_description: e.target.value })}
            rows={3}
            className={textareaClassName}
          />
        </FormField>
        <FormField label="Website URL" htmlFor="settings-website-url">
          <input
            id="settings-website-url"
            type="url"
            value={form.website_url}
            onChange={(e) => update({ website_url: e.target.value })}
            className={inputClassName}
          />
        </FormField>
        <FormField label="Default Author" htmlFor="settings-default-author">
          <input
            id="settings-default-author"
            type="text"
            value={form.default_author}
            onChange={(e) => update({ default_author: e.target.value })}
            className={inputClassName}
          />
        </FormField>
      </div>
    </section>
  );
}
