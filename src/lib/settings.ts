// ============ App settings (Supabase) — server/API only; do not import from client components ============

import { supabaseAdmin } from "./supabase";
import type { AppSettings, AIModelOption } from "./settings-client";

export type { AppSettings, AIModelOption } from "./settings-client";

const DEFAULT_AI_MODELS: AIModelOption[] = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

const DEFAULT_SETTINGS: AppSettings = {
  id: "global",
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

function parseAiModelsRaw(raw: unknown): unknown[] {
  if (Array.isArray(raw) && raw.length > 0) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** DB stores ai_models as string[] (model ids only). We normalize to { value, label } for the app. */
function normalizeAiModels(raw: unknown): AIModelOption[] {
  const arr = parseAiModelsRaw(raw);
  if (arr.length === 0) return [...DEFAULT_AI_MODELS];
  const result: AIModelOption[] = [];
  for (const x of arr) {
    if (typeof x === "string" && x.trim()) {
      try {
        const parsed = JSON.parse(x) as { value?: string; label?: string };
        if (parsed != null && typeof parsed === "object" && String(parsed.value ?? "").trim()) {
          result.push({
            value: String(parsed.value ?? "").trim(),
            label: String(parsed.label ?? parsed.value ?? "").trim(),
          });
          continue;
        }
      } catch {
        /* fall through: treat as plain model id */
      }
      result.push({ value: x.trim(), label: x.trim() });
    } else if (x != null && typeof x === "object") {
      const obj = x as { value?: string; label?: string };
      const value = String(obj.value ?? "").trim();
      if (value) result.push({ value, label: String(obj.label ?? obj.value ?? "").trim() || value });
    }
  }
  return result.length > 0 ? result : [...DEFAULT_AI_MODELS];
}

function normalizeRow(row: Record<string, unknown> | null): AppSettings {
  if (!row || typeof row !== "object") return { ...DEFAULT_SETTINGS };
  return {
    id: typeof row.id === "string" ? row.id : DEFAULT_SETTINGS.id,
    company_name: typeof row.company_name === "string" ? row.company_name : DEFAULT_SETTINGS.company_name,
    company_description: typeof row.company_description === "string" ? row.company_description : DEFAULT_SETTINGS.company_description,
    website_url: typeof row.website_url === "string" ? row.website_url : DEFAULT_SETTINGS.website_url,
    default_author: typeof row.default_author === "string" ? row.default_author : DEFAULT_SETTINGS.default_author,
    default_tone: typeof row.default_tone === "string" ? row.default_tone : DEFAULT_SETTINGS.default_tone,
    default_article_length: typeof row.default_article_length === "string" ? row.default_article_length : DEFAULT_SETTINGS.default_article_length,
    default_model: typeof row.default_model === "string" ? row.default_model : DEFAULT_SETTINGS.default_model,
    ai_models: normalizeAiModels(row.ai_models),
    ai_instructions: typeof row.ai_instructions === "string" ? row.ai_instructions : DEFAULT_SETTINGS.ai_instructions,
    ai_forbidden_topics: typeof row.ai_forbidden_topics === "string" ? row.ai_forbidden_topics : DEFAULT_SETTINGS.ai_forbidden_topics,
    ai_forbidden_companies: typeof row.ai_forbidden_companies === "string" ? row.ai_forbidden_companies : DEFAULT_SETTINGS.ai_forbidden_companies,
    ai_link_policy:
      row.ai_link_policy === "internal_only" || row.ai_link_policy === "no_links" || row.ai_link_policy === "allow_all"
        ? row.ai_link_policy
        : DEFAULT_SETTINGS.ai_link_policy,
    seo_default_keywords: Array.isArray(row.seo_default_keywords)
      ? (row.seo_default_keywords as string[]).filter((x) => typeof x === "string")
      : DEFAULT_SETTINGS.seo_default_keywords,
    categories: Array.isArray(row.categories)
      ? (row.categories as string[]).filter((x) => typeof x === "string")
      : DEFAULT_SETTINGS.categories,
  };
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("*")
      .eq("id", "global")
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      return { ...DEFAULT_SETTINGS };
    }
    return normalizeRow(data as Record<string, unknown>);
  } catch (e) {
    console.error("getSettings error:", e);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function updateSettings(updates: Partial<Omit<AppSettings, "id">>): Promise<AppSettings> {
  const payload: Record<string, unknown> = { id: "global", ...updates };
  if (Object.keys(payload).length === 1) return getSettings();

  // Persist ai_models as string[] (model ids only) in the DB
  if (Array.isArray(payload.ai_models)) {
    payload.ai_models = (payload.ai_models as AIModelOption[]).map((m) => (typeof m === "object" && m && "value" in m ? m.value : String(m))).filter(Boolean);
  }

  const { data, error } = await supabaseAdmin
    .from("settings")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Error updating settings:", error);
    throw new Error(error.message);
  }
  return normalizeRow(data as Record<string, unknown>);
}
