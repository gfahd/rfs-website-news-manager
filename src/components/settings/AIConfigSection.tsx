"use client";

import { Brain } from "lucide-react";
import type { Ref } from "react";
import type { AppSettings } from "@/lib/settings-client";
import { FormField, inputClassName, selectClassName, textareaClassName, SubCard } from "./form-primitives";
import { SettingsSectionHeader } from "./SettingsSectionHeader";
import { LENGTH_OPTIONS, LINK_POLICY_OPTIONS, TONE_OPTIONS } from "./constants";

export function AIConfigSection({
  form,
  update,
  newModelInput,
  setNewModelInput,
  sectionHeadingRef,
}: {
  form: Omit<AppSettings, "id">;
  update: (updates: Partial<Omit<AppSettings, "id">>) => void;
  newModelInput: string;
  setNewModelInput: (v: string) => void;
  sectionHeadingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <section
      id="settings-panel-ai"
      role="tabpanel"
      aria-labelledby="settings-panel-ai-heading"
      className="space-y-6"
    >
      <SettingsSectionHeader
        icon={Brain}
        title="AI Configuration"
        description="Default models, tone, article length, custom instructions, and link policy for AI features."
        headingRef={sectionHeadingRef}
        id="settings-panel-ai-heading"
      />

      <div className="space-y-6">
        <SubCard title="Model selection">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Default Model" htmlFor="settings-default-model">
              <select
                id="settings-default-model"
                value={form.ai_models.some((o) => o.value === form.default_model) ? form.default_model : form.ai_models[0]?.value}
                onChange={(e) => update({ default_model: e.target.value })}
                className={selectClassName}
              >
                {form.ai_models.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="sm:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
              <div className="flex-1 min-w-0">
                <FormField label="Add model" htmlFor="settings-add-model">
                  <input
                    id="settings-add-model"
                    type="text"
                    value={newModelInput}
                    onChange={(e) => setNewModelInput(e.target.value)}
                    placeholder="e.g. gemini-1.5-flash"
                    className={inputClassName}
                  />
                </FormField>
              </div>
              <button
                type="button"
                onClick={() => {
                  const id = newModelInput.trim();
                  if (!id || form.ai_models.some((m) => m.value === id)) return;
                  const entry = { value: id, label: id };
                  update({ ai_models: [...form.ai_models, entry], default_model: id });
                  setNewModelInput("");
                }}
                disabled={!newModelInput.trim()}
                className="px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-medium shrink-0 min-h-[44px]"
              >
                Add & set default
              </button>
            </div>
          </div>
        </SubCard>

        <SubCard title="Tone & length">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Default Tone" htmlFor="settings-tone">
              <select
                id="settings-tone"
                value={form.default_tone}
                onChange={(e) => update({ default_tone: e.target.value })}
                className={selectClassName}
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Default Length" htmlFor="settings-length">
              <select
                id="settings-length"
                value={form.default_article_length}
                onChange={(e) => update({ default_article_length: e.target.value })}
                className={selectClassName}
              >
                {LENGTH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </SubCard>

        <SubCard title="Instructions & rules">
          <div className="space-y-4">
            <FormField label="Custom Instructions" htmlFor="settings-ai-instructions">
              <textarea
                id="settings-ai-instructions"
                value={form.ai_instructions}
                onChange={(e) => update({ ai_instructions: e.target.value })}
                rows={6}
                placeholder="e.g., Always spell company name as 'RedFlag Security' (one word). Always mention our 24/7 monitoring."
                className={textareaClassName}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                These instructions apply to ALL AI features: article generation, topic discovery, text improvement, metadata generation, and image prompts.
              </p>
            </FormField>
            <FormField label="Forbidden Competitors" htmlFor="settings-forbidden-companies">
              <textarea
                id="settings-forbidden-companies"
                value={form.ai_forbidden_companies}
                onChange={(e) => update({ ai_forbidden_companies: e.target.value })}
                rows={3}
                placeholder={`One per line:\nADT\nSimplisafe\nRing`}
                className={textareaClassName}
              />
            </FormField>
            <FormField label="Forbidden Topics" htmlFor="settings-forbidden-topics">
              <textarea
                id="settings-forbidden-topics"
                value={form.ai_forbidden_topics}
                onChange={(e) => update({ ai_forbidden_topics: e.target.value })}
                rows={3}
                placeholder="Topics AI should avoid, one per line"
                className={textareaClassName}
              />
            </FormField>
          </div>
        </SubCard>

        <SubCard title="Link policy">
          <div role="radiogroup" aria-label="AI link policy" className="flex flex-wrap gap-2">
            {LINK_POLICY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-red-500/40 ${
                  form.ai_link_policy === opt.value
                    ? "border-red-500/60 bg-red-500/10 text-white shadow-sm"
                    : "border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="ai_link_policy"
                  value={opt.value}
                  checked={form.ai_link_policy === opt.value}
                  onChange={() => update({ ai_link_policy: opt.value })}
                  className="sr-only"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </SubCard>
      </div>
    </section>
  );
}
