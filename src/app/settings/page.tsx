"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useError } from "@/context/ErrorContext";
import { Settings as SettingsIcon, X, AlertTriangle } from "lucide-react";
import { getAiModelsCache, setAiModelsCache, type AppSettings, type AIModelOption } from "@/lib/settings-client";

const TONE_OPTIONS = [
  "Professional",
  "Friendly",
  "Technical",
  "Persuasive",
  "Conversational",
];

const LENGTH_OPTIONS = [
  { value: "short", label: "Short ~400 words" },
  { value: "medium", label: "Medium ~800 words" },
  { value: "long", label: "Long ~1200 words" },
];

const LINK_POLICY_OPTIONS = [
  { value: "internal_only", label: "Internal links only (recommended)" },
  { value: "no_links", label: "No links" },
  { value: "allow_all", label: "Allow all links" },
] as const;

const DEFAULT_AI_MODELS: AIModelOption[] = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

const DEFAULT_SETTINGS: Omit<AppSettings, "id"> = {
  company_name: "Red Flag Security",
  company_description: "Canadian company that installs alarm systems, CCTV cameras, access control systems, and provides 24/7 alarm monitoring.",
  website_url: "https://redflagsecurity.ca",
  default_author: "Red Flag Security Team",
  default_tone: "Professional",
  default_article_length: "medium",
  default_model: "gemini-2.5-flash",
  ai_models: DEFAULT_AI_MODELS,
  ai_instructions: "",
  ai_forbidden_topics: "",
  ai_forbidden_companies: "",
  ai_link_policy: "internal_only",
  seo_default_keywords: [],
  categories: [],
};

function settingsToForm(s: AppSettings | undefined): Omit<AppSettings, "id"> | null {
  if (!s) return null;
  let aiModels = DEFAULT_AI_MODELS;
  // API returns ai_models already normalized; support raw array of strings (value-only) from DB
  const aiModelsRaw = (s as { ai_models?: unknown }).ai_models;
  if (Array.isArray(aiModelsRaw) && aiModelsRaw.length > 0) {
    const list = aiModelsRaw.map((m: unknown) => {
      if (typeof m === "string" && m.trim()) {
        try {
          const parsed = JSON.parse(m) as { value?: string; label?: string };
          if (parsed != null && typeof parsed === "object" && String(parsed.value ?? "").trim()) {
            return { value: String(parsed.value ?? "").trim(), label: String(parsed.label ?? parsed.value ?? "").trim() };
          }
        } catch {
          /* plain model id */
        }
        return { value: m.trim(), label: m.trim() };
      }
      const obj = m as { value?: string; label?: string };
      const value = String(obj?.value ?? "").trim();
      return { value, label: String(obj?.label ?? obj?.value ?? "").trim() || value };
    }).filter((m) => m.value && m.label);
    if (list.length > 0) aiModels = list as typeof DEFAULT_AI_MODELS;
  } else if (typeof aiModelsRaw === "string" && aiModelsRaw.trim()) {
    try {
      const parsed = JSON.parse(aiModelsRaw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const list = parsed.map((m: unknown) => {
          if (typeof m === "string" && m.trim()) {
            try {
              const parsedItem = JSON.parse(m) as { value?: string; label?: string };
              if (parsedItem != null && typeof parsedItem === "object" && String(parsedItem.value ?? "").trim()) {
                return { value: String(parsedItem.value ?? "").trim(), label: String(parsedItem.label ?? parsedItem.value ?? "").trim() };
              }
            } catch {
              /* plain model id */
            }
            return { value: (m as string).trim(), label: (m as string).trim() };
          }
          const obj = m as { value?: string; label?: string };
          const value = String(obj?.value ?? "").trim();
          return { value, label: String(obj?.label ?? obj?.value ?? "").trim() || value };
        }).filter((m) => m.value && m.label);
        if (list.length > 0) aiModels = list as typeof DEFAULT_AI_MODELS;
      }
    } catch {
      /* keep default */
    }
  }
  const defaultModel = s.default_model ?? DEFAULT_SETTINGS.default_model;
  return {
    company_name: s.company_name ?? DEFAULT_SETTINGS.company_name,
    company_description: s.company_description ?? DEFAULT_SETTINGS.company_description,
    website_url: s.website_url ?? DEFAULT_SETTINGS.website_url,
    default_author: s.default_author ?? DEFAULT_SETTINGS.default_author,
    default_tone: s.default_tone ?? DEFAULT_SETTINGS.default_tone,
    default_article_length: s.default_article_length ?? DEFAULT_SETTINGS.default_article_length,
    default_model: defaultModel,
    ai_models: aiModels,
    ai_instructions: s.ai_instructions ?? "",
    ai_forbidden_topics: s.ai_forbidden_topics ?? "",
    ai_forbidden_companies: s.ai_forbidden_companies ?? "",
    ai_link_policy: s.ai_link_policy ?? "internal_only",
    seo_default_keywords: Array.isArray(s.seo_default_keywords) ? s.seo_default_keywords : [],
    categories: Array.isArray(s.categories) ? s.categories : [],
  };
}

function mergeWithAiModelsCache(next: Omit<AppSettings, "id">): Omit<AppSettings, "id"> {
  const cache = getAiModelsCache();
  if (!cache || cache.ai_models.length === 0) return next;
  if (next.ai_models.length <= 2 && cache.ai_models.length > next.ai_models.length) {
    const defaultModel = cache.default_model && cache.ai_models.some((m) => m.value === cache.default_model) ? cache.default_model : cache.ai_models[0].value;
    return { ...next, ai_models: cache.ai_models, default_model: defaultModel };
  }
  return next;
}

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim().replace(/^[,]+|[,]+$/g, "");
    if (!tag || values.includes(tag)) return;
    onChange([...values, tag]);
    setInput("");
  };

  const remove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 min-h-[42px]">
      {values.map((v, i) => (
        <span
          key={`${v}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-3 py-1 text-sm text-white"
        >
          {v}
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded-full p-0.5 hover:bg-slate-600 text-slate-400 hover:text-white"
            aria-label={`Remove ${v}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(input);
          }
        }}
        onBlur={() => input.trim() && add(input)}
        placeholder={placeholder}
        className="flex-1 min-w-[120px] bg-transparent text-white placeholder:text-slate-500 border-none outline-none text-sm py-1"
      />
    </div>
  );
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { showError } = useError();
  const [showResetModal, setShowResetModal] = useState(false);
  const [initial, setInitial] = useState<Omit<AppSettings, "id"> | null>(null);
  const [form, setForm] = useState<Omit<AppSettings, "id">>(DEFAULT_SETTINGS);
  const [newModelInput, setNewModelInput] = useState("");
  const loadedOnceRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (!res.ok) return;
      const s = data.settings as AppSettings;
      let next = settingsToForm(s);
      if (next) {
        next = mergeWithAiModelsCache(next);
        setForm(next);
        setInitial(next);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session && !loadedOnceRef.current) {
      loadedOnceRef.current = true;
      loadSettings();
    }
  }, [session, loadSettings]);

  const hasChanges =
    initial !== null &&
    (JSON.stringify(form) !== JSON.stringify(initial));

  const update = (updates: Partial<Omit<AppSettings, "id">>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setAiModelsCache(form.ai_models, form.default_model);
      const saved = data.settings as AppSettings | undefined;
      let next = settingsToForm(saved);
      if (next) {
        next = mergeWithAiModelsCache(next);
        if (next.ai_models.length <= 2 && form.ai_models.length > 2) {
          next = { ...next, ai_models: form.ai_models, default_model: form.default_model };
        }
        setForm(next);
        setInitial(next);
      } else {
        setInitial(form);
      }
      setSuccessToast("Settings saved.");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      showError("Failed to save", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setForm(DEFAULT_SETTINGS);
    setInitial(DEFAULT_SETTINGS);
    setShowResetModal(false);
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEFAULT_SETTINGS),
      });
      setSuccessToast("Settings reset to defaults.");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (e) {
      showError("Failed to reset settings.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="md:ml-64 md:p-8 p-4 pt-16">
        {/* Sticky header with title and Save */}
        <div className="sticky top-14 md:top-0 z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-slate-950/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-slate-400" />
            Settings
          </h1>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 min-h-[44px] bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:pointer-events-none text-white rounded-lg px-6 py-2.5 font-medium transition-colors"
          >
            {hasChanges && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" title="Unsaved changes" />
            )}
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>

        {successToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 bg-emerald-600/95 text-white rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200">
            <span>{successToast}</span>
            <button type="button" onClick={() => setSuccessToast(null)} className="p-1 hover:bg-white/20 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-red-500" />
          </div>
        ) : (
          <div className="space-y-6 w-full max-w-3xl">
            {/* Section 1 — Company Information */}
            <section className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                Company Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Company Name</label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={(e) => update({ company_name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Company Description</label>
                  <textarea
                    value={form.company_description}
                    onChange={(e) => update({ company_description: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 resize-y"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Website URL</label>
                  <input
                    type="url"
                    value={form.website_url}
                    onChange={(e) => update({ website_url: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Default Author</label>
                  <input
                    type="text"
                    value={form.default_author}
                    onChange={(e) => update({ default_author: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                  />
                </div>
              </div>
            </section>

            {/* Section 2 — AI Defaults */}
            <section className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                AI Defaults
              </h2>
              <div className="grid gap-4 sm:grid-cols-3 mb-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Default Model</label>
                  <select
                    value={form.ai_models.some((o) => o.value === form.default_model) ? form.default_model : form.ai_models[0]?.value}
                    onChange={(e) => update({ default_model: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                  >
                    {form.ai_models.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-end gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Add model</label>
                    <input
                      type="text"
                      value={newModelInput}
                      onChange={(e) => setNewModelInput(e.target.value)}
                      placeholder="e.g. gemini-1.5-flash"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                    />
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
                    className="px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-medium shrink-0"
                  >
                    Add & set default
                  </button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Default Tone</label>
                  <select
                    value={form.default_tone}
                    onChange={(e) => update({ default_tone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                  >
                    {TONE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Default Length</label>
                  <select
                    value={form.default_article_length}
                    onChange={(e) => update({ default_article_length: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                  >
                    {LENGTH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Section 3 — AI Instructions */}
            <section className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                AI Instructions
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Custom Instructions</label>
                  <textarea
                    value={form.ai_instructions}
                    onChange={(e) => update({ ai_instructions: e.target.value })}
                    rows={6}
                    placeholder="e.g., Always spell company name as 'RedFlag Security' (one word). Always mention our 24/7 monitoring."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 resize-y"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    These instructions apply to ALL AI features: article generation, topic discovery, text improvement, metadata generation, and image prompts.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Forbidden Competitors</label>
                  <textarea
                    value={form.ai_forbidden_companies}
                    onChange={(e) => update({ ai_forbidden_companies: e.target.value })}
                    rows={3}
                    placeholder={`One per line:\nADT\nSimplisafe\nRing`}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 resize-y"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Forbidden Topics</label>
                  <textarea
                    value={form.ai_forbidden_topics}
                    onChange={(e) => update({ ai_forbidden_topics: e.target.value })}
                    rows={3}
                    placeholder="Topics AI should avoid, one per line"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 resize-y"
                  />
                </div>
              </div>
            </section>

            {/* Section 4 — Link Policy */}
            <section className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                Link Policy
              </h2>
              <div className="space-y-2">
                {LINK_POLICY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="ai_link_policy"
                      value={opt.value}
                      checked={form.ai_link_policy === opt.value}
                      onChange={() => update({ ai_link_policy: opt.value })}
                      className="w-4 h-4 text-red-500 bg-slate-800 border-slate-600 focus:ring-red-500"
                    />
                    <span className="text-slate-200">{opt.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Section 5 — Content Organization */}
            <section className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                Content Organization
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Categories</label>
                  <TagInput
                    values={form.categories}
                    onChange={(categories) => update({ categories })}
                    placeholder="Add category…"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Default SEO Keywords</label>
                  <TagInput
                    values={form.seo_default_keywords}
                    onChange={(seo_default_keywords) => update({ seo_default_keywords })}
                    placeholder="Add keyword…"
                  />
                </div>
              </div>
            </section>

            {/* Section 6 — Danger Zone */}
            <section className="bg-slate-900 rounded-xl p-6 border border-red-900/50 border-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Danger Zone
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Reset all settings to default values. This cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Reset to Defaults
              </button>
            </section>
          </div>
        )}

        {/* Reset confirmation modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60" onClick={() => setShowResetModal(false)}>
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mx-4 md:mx-auto max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-2">Reset to defaults?</h3>
              <p className="text-slate-400 text-sm mb-6">
                All settings will be replaced with default values and saved immediately.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
