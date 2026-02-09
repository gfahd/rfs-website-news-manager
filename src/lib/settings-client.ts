// ============ Client-side only — no Supabase (safe for client bundle) ============

export const GEMINI_MODEL_KEY = "gemini-model";
export const GEMINI_MODEL_DEFAULT = "gemini-2.5-flash";

const AI_MODELS_CACHE_KEY = "settings_ai_models_cache";

export function getStoredGeminiModel(): string {
  if (typeof window === "undefined") return GEMINI_MODEL_DEFAULT;
  const stored = localStorage.getItem(GEMINI_MODEL_KEY);
  if (stored === "gemini-2.0-flash" || stored === "gemini-2.5-flash" || stored === "gemini-3-flash-preview") return stored;
  return GEMINI_MODEL_DEFAULT;
}

/** Client cache for ai_models when DB does not persist them. Used by Settings and article pages. */
export function getAiModelsCache(): { ai_models: AIModelOption[]; default_model: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AI_MODELS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ai_models?: unknown; default_model?: string };
    if (!parsed || !Array.isArray(parsed.ai_models) || parsed.ai_models.length === 0) return null;
    const list = parsed.ai_models
      .filter((m: unknown): m is { value?: string; label?: string } => m != null && typeof m === "object")
      .map((m) => ({ value: String(m?.value ?? "").trim(), label: String(m?.label ?? m?.value ?? "").trim() }))
      .filter((m) => m.value && m.label);
    if (list.length === 0) return null;
    return { ai_models: list as AIModelOption[], default_model: String(parsed.default_model ?? list[0].value).trim() || list[0].value };
  } catch {
    return null;
  }
}

export function setAiModelsCache(ai_models: AIModelOption[], default_model: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AI_MODELS_CACHE_KEY, JSON.stringify({ ai_models, default_model }));
  } catch {
    /* ignore */
  }
}

export interface AIModelOption {
  value: string;
  label: string;
}

export interface AppSettings {
  id: string;
  company_name: string;
  company_description: string;
  website_url: string;
  default_author: string;
  default_tone: string;
  default_article_length: string;
  default_model: string;
  ai_models: AIModelOption[];
  ai_instructions: string;
  ai_forbidden_topics: string;
  ai_forbidden_companies: string;
  ai_link_policy: "internal_only" | "no_links" | "allow_all";
  seo_default_keywords: string[];
  categories: string[];
  discovery_categories: string[];
}
