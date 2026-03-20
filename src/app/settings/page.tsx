"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useError } from "@/context/ErrorContext";
import { Settings as SettingsIcon, X } from "lucide-react";
import { getAiModelsCache, setAiModelsCache, type AppSettings } from "@/lib/settings-client";
import {
  type ChatWidgetConfig,
  rowsToChatWidgetConfig,
  DEFAULT_CHAT_WIDGET_CONFIG,
} from "@/types/chat-widget";
import { DEFAULT_AI_MODELS } from "@/components/settings/constants";
import { SettingsNav, type SettingsTabId } from "@/components/settings/SettingsNav";
import { ChatWidgetSection } from "@/components/settings/ChatWidgetSection";
import { AccessControlSection } from "@/components/settings/AccessControlSection";
import { CompanyInfoSection } from "@/components/settings/CompanyInfoSection";
import { AIConfigSection } from "@/components/settings/AIConfigSection";
import { ContentSeoSection } from "@/components/settings/ContentSeoSection";
import { DangerZoneSection } from "@/components/settings/DangerZoneSection";
import { SettingsLoadingSkeleton } from "@/components/settings/SettingsLoadingSkeleton";

const DEFAULT_SETTINGS: Omit<AppSettings, "id"> = {
  company_name: "Red Flag Security",
  company_description:
    "Canadian company that installs alarm systems, CCTV cameras, access control systems, and provides 24/7 alarm monitoring.",
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
  discovery_categories: [
    "Residential Security",
    "Commercial Security",
    "Alarm Systems",
    "Access Control",
    "CCTV & Surveillance",
    "Intercom Systems",
    "Smart Wiring",
    "Video Doorbell",
    "Medical Safety",
    "Home Automation",
    "Fire & Life Safety",
    "Cybersecurity",
  ],
  allowed_login_emails: [],
};

function settingsToForm(s: AppSettings | undefined): Omit<AppSettings, "id"> | null {
  if (!s) return null;
  let aiModels = DEFAULT_AI_MODELS;
  const aiModelsRaw = (s as { ai_models?: unknown }).ai_models;
  if (Array.isArray(aiModelsRaw) && aiModelsRaw.length > 0) {
    const list = aiModelsRaw
      .map((m: unknown) => {
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
      })
      .filter((m) => m.value && m.label);
    if (list.length > 0) aiModels = list as typeof DEFAULT_AI_MODELS;
  } else if (typeof aiModelsRaw === "string" && aiModelsRaw.trim()) {
    try {
      const parsed = JSON.parse(aiModelsRaw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const list = parsed
          .map((m: unknown) => {
            if (typeof m === "string" && m.trim()) {
              try {
                const parsedItem = JSON.parse(m) as { value?: string; label?: string };
                if (parsedItem != null && typeof parsedItem === "object" && String(parsedItem.value ?? "").trim()) {
                  return {
                    value: String(parsedItem.value ?? "").trim(),
                    label: String(parsedItem.label ?? parsedItem.value ?? "").trim(),
                  };
                }
              } catch {
                /* plain model id */
              }
              return { value: (m as string).trim(), label: (m as string).trim() };
            }
            const obj = m as { value?: string; label?: string };
            const value = String(obj?.value ?? "").trim();
            return { value, label: String(obj?.label ?? obj?.value ?? "").trim() || value };
          })
          .filter((m) => m.value && m.label);
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
    discovery_categories: Array.isArray((s as { discovery_categories?: string[] }).discovery_categories)
      ? (s as { discovery_categories: string[] }).discovery_categories
      : DEFAULT_SETTINGS.discovery_categories,
    allowed_login_emails: Array.isArray((s as { allowed_login_emails?: string[] }).allowed_login_emails)
      ? (s as { allowed_login_emails: string[] }).allowed_login_emails
      : DEFAULT_SETTINGS.allowed_login_emails,
  };
}

function mergeWithAiModelsCache(next: Omit<AppSettings, "id">): Omit<AppSettings, "id"> {
  const cache = getAiModelsCache();
  if (!cache || cache.ai_models.length === 0) return next;
  if (next.ai_models.length <= 2 && cache.ai_models.length > next.ai_models.length) {
    const defaultModel =
      cache.default_model && cache.ai_models.some((m) => m.value === cache.default_model)
        ? cache.default_model
        : cache.ai_models[0].value;
    return { ...next, ai_models: cache.ai_models, default_model: defaultModel };
  }
  return next;
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
  const [activeTab, setActiveTab] = useState<SettingsTabId>("chat");
  const sectionHeadingRef = useRef<HTMLHeadingElement>(null);

  const [chatWidgetLoading, setChatWidgetLoading] = useState(true);
  const [chatWidget, setChatWidget] = useState<ChatWidgetConfig>(DEFAULT_CHAT_WIDGET_CONFIG);
  const [chatWidgetBaseline, setChatWidgetBaseline] = useState<ChatWidgetConfig | null>(null);
  const [chatWidgetSavingKey, setChatWidgetSavingKey] = useState<string | null>(null);
  const [chatWidgetSavingSection, setChatWidgetSavingSection] = useState<string | null>(null);
  const [chatWidgetSuccessToast, setChatWidgetSuccessToast] = useState<string | null>(null);
  const [chatWidgetLastSaved, setChatWidgetLastSaved] = useState<Record<string, string>>({});

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

  const loadPublicConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/public-configs");
      const data = await res.json();
      if (!res.ok) return;
      const rows = data.configs || [];
      const next = rowsToChatWidgetConfig(rows);
      setChatWidget(next);
      setChatWidgetBaseline(next);
    } catch (e) {
      console.error("Failed to load chat widget config", e);
    } finally {
      setChatWidgetLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadPublicConfigs();
  }, [session, loadPublicConfigs]);

  const upsertChatWidget = useCallback(async (entries: Array<{ key: string; value: string }>) => {
    const res = await fetch("/api/public-configs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entries),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save");
    return data.configs as Array<{ key: string; value: string | null }>;
  }, []);

  const saveChatWidgetToggle = useCallback(
    async (key: keyof ChatWidgetConfig, value: boolean) => {
      setChatWidgetSavingKey(key);
      try {
        const configs = await upsertChatWidget([{ key, value: value ? "true" : "false" }]);
        const next = rowsToChatWidgetConfig(configs);
        setChatWidget(next);
        setChatWidgetBaseline(next);
        setChatWidgetLastSaved((prev) => ({ ...prev, [key]: new Date().toISOString() }));
      } catch (e) {
        showError("Chat widget", e instanceof Error ? e.message : "Failed to save");
      } finally {
        setChatWidgetSavingKey(null);
      }
    },
    [upsertChatWidget, showError]
  );

  const saveChatWidgetSection = useCallback(
    async (section: "master" | "urls", keys: (keyof ChatWidgetConfig)[]) => {
      setChatWidgetSavingSection(section);
      try {
        const entries = keys.map((k) => ({
          key: k,
          value: typeof chatWidget[k] === "boolean" ? (chatWidget[k] ? "true" : "false") : String(chatWidget[k] ?? ""),
        }));
        const configs = await upsertChatWidget(entries);
        const next = rowsToChatWidgetConfig(configs);
        setChatWidget(next);
        setChatWidgetBaseline(next);
        const now = new Date().toISOString();
        setChatWidgetLastSaved((prev) => {
          const n = { ...prev };
          keys.forEach((k) => (n[k] = now));
          return n;
        });
        setChatWidgetSuccessToast("Chat widget settings updated successfully");
        setTimeout(() => setChatWidgetSuccessToast(null), 3000);
      } catch (e) {
        showError("Chat widget", e instanceof Error ? e.message : "Failed to save");
      } finally {
        setChatWidgetSavingSection(null);
      }
    },
    [chatWidget, upsertChatWidget, showError]
  );

  const hasChanges = initial !== null && JSON.stringify(form) !== JSON.stringify(initial);

  const chatWidgetDirty = useMemo(() => {
    if (chatWidgetLoading || chatWidgetBaseline === null) return false;
    return JSON.stringify(chatWidget) !== JSON.stringify(chatWidgetBaseline);
  }, [chatWidget, chatWidgetBaseline, chatWidgetLoading]);

  const dirtyByTab = useMemo((): Record<SettingsTabId, boolean> => {
    if (!initial) {
      return {
        chat: false,
        access: false,
        company: false,
        ai: false,
        content: false,
        danger: false,
      };
    }
    return {
      chat: chatWidgetDirty,
      access: JSON.stringify(form.allowed_login_emails) !== JSON.stringify(initial.allowed_login_emails),
      company:
        form.company_name !== initial.company_name ||
        form.company_description !== initial.company_description ||
        form.website_url !== initial.website_url ||
        form.default_author !== initial.default_author,
      ai:
        form.default_model !== initial.default_model ||
        JSON.stringify(form.ai_models) !== JSON.stringify(initial.ai_models) ||
        form.default_tone !== initial.default_tone ||
        form.default_article_length !== initial.default_article_length ||
        form.ai_instructions !== initial.ai_instructions ||
        form.ai_forbidden_topics !== initial.ai_forbidden_topics ||
        form.ai_forbidden_companies !== initial.ai_forbidden_companies ||
        form.ai_link_policy !== initial.ai_link_policy,
      content:
        JSON.stringify(form.categories) !== JSON.stringify(initial.categories) ||
        JSON.stringify(form.seo_default_keywords) !== JSON.stringify(initial.seo_default_keywords) ||
        JSON.stringify(form.discovery_categories) !== JSON.stringify(initial.discovery_categories),
      danger: false,
    };
  }, [form, initial, chatWidgetDirty]);

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

  useEffect(() => {
    const id = requestAnimationFrame(() => sectionHeadingRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [activeTab]);

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
      <main className="md:ml-64 md:p-8 p-4 pt-16 pb-32">
        <div className="sticky top-14 md:top-0 z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-slate-950/95 border-b border-slate-800 mb-6 md:mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-slate-400" aria-hidden />
            Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage CMS configuration and live chat widget.</p>
        </div>

        {successToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 bg-emerald-600/95 text-white rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200">
            <span>{successToast}</span>
            <button type="button" onClick={() => setSuccessToast(null)} className="p-1 hover:bg-white/20 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {chatWidgetSuccessToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 bg-emerald-600/95 text-white rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200">
            <span>{chatWidgetSuccessToast}</span>
            <button type="button" onClick={() => setChatWidgetSuccessToast(null)} className="p-1 hover:bg-white/20 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <SettingsLoadingSkeleton />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start w-full max-w-6xl">
            <SettingsNav activeTab={activeTab} onTabChange={setActiveTab} dirtyByTab={dirtyByTab} />
            <div className="flex-1 min-w-0">
              <div key={activeTab} className="settings-panel-animate transition-opacity duration-200">
                {activeTab === "chat" && (
                  <ChatWidgetSection
                    chatWidget={chatWidget}
                    setChatWidget={setChatWidget}
                    chatWidgetLoading={chatWidgetLoading}
                    chatWidgetSavingKey={chatWidgetSavingKey}
                    chatWidgetSavingSection={chatWidgetSavingSection}
                    chatWidgetLastSaved={chatWidgetLastSaved}
                    saveChatWidgetToggle={saveChatWidgetToggle}
                    saveChatWidgetSection={saveChatWidgetSection}
                    sectionHeadingRef={sectionHeadingRef}
                  />
                )}
                {activeTab === "access" && (
                  <AccessControlSection form={form} update={update} sectionHeadingRef={sectionHeadingRef} />
                )}
                {activeTab === "company" && (
                  <CompanyInfoSection form={form} update={update} sectionHeadingRef={sectionHeadingRef} />
                )}
                {activeTab === "ai" && (
                  <AIConfigSection
                    form={form}
                    update={update}
                    newModelInput={newModelInput}
                    setNewModelInput={setNewModelInput}
                    sectionHeadingRef={sectionHeadingRef}
                  />
                )}
                {activeTab === "content" && (
                  <ContentSeoSection form={form} update={update} sectionHeadingRef={sectionHeadingRef} />
                )}
                {activeTab === "danger" && (
                  <DangerZoneSection onOpenResetModal={() => setShowResetModal(true)} sectionHeadingRef={sectionHeadingRef} />
                )}
              </div>
            </div>
          </div>
        )}

        {hasChanges && !loading && (
          <div
            className="fixed bottom-0 left-0 right-0 md:left-64 z-30 pointer-events-none px-4 pb-4 pt-8 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent"
            aria-live="polite"
          >
            <div className="max-w-6xl mx-auto flex justify-end">
              <div className="pointer-events-auto w-full max-w-md settings-save-bar-animate rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-sm shadow-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" aria-hidden />
                  You have unsaved changes
                </p>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 min-h-[44px] bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:pointer-events-none text-white rounded-lg px-6 py-2.5 font-medium transition-colors shrink-0"
                >
                  {saving ? "Saving…" : "Save Settings"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showResetModal && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowResetModal(false)}
          >
            <div
              className="bg-slate-900 rounded-xl border border-slate-700 p-6 mx-4 md:mx-auto max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-2">Reset to defaults?</h3>
              <p className="text-slate-400 text-sm mb-6">All settings will be replaced with default values and saved immediately.</p>
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
