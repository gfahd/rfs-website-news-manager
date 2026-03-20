"use client";

import { Compass, FolderOpen } from "lucide-react";
import type { Ref } from "react";
import type { AppSettings } from "@/lib/settings-client";
import { TagInput } from "@/components/ui/TagInput";
import { FormField, SubCard } from "./form-primitives";
import { SettingsSectionHeader } from "./SettingsSectionHeader";

export function ContentSeoSection({
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
      id="settings-panel-content"
      role="tabpanel"
      aria-labelledby="settings-panel-content-heading"
      className="space-y-6"
    >
      <SettingsSectionHeader
        icon={FolderOpen}
        title="Content & SEO"
        description="Organize categories, default SEO keywords, and topic discovery categories."
        headingRef={sectionHeadingRef}
        id="settings-panel-content-heading"
      />

      <SubCard title="Content organization">
        <div className="space-y-4">
          <FormField label="Categories" htmlFor="settings-categories-input">
            <TagInput
              inputId="settings-categories-input"
              values={form.categories}
              onChange={(categories) => update({ categories })}
              placeholder="Add category…"
            />
          </FormField>
          <FormField label="Default SEO Keywords" htmlFor="settings-seo-keywords-input">
            <TagInput
              inputId="settings-seo-keywords-input"
              values={form.seo_default_keywords}
              onChange={(seo_default_keywords) => update({ seo_default_keywords })}
              placeholder="Add keyword…"
            />
          </FormField>
        </div>
      </SubCard>

      <SubCard title="Topic discovery">
        <div className="flex items-start gap-2 mb-3">
          <Compass className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-slate-400">
            Categories used when discovering trending topics. These define what the AI searches for.
          </p>
        </div>
        <FormField label="Discovery categories" htmlFor="settings-discovery-input">
          <TagInput
            inputId="settings-discovery-input"
            values={form.discovery_categories}
            onChange={(discovery_categories) => update({ discovery_categories })}
            placeholder="Add category…"
          />
        </FormField>
      </SubCard>
    </section>
  );
}
