// ============ Client-side only — no Supabase (safe for client bundle) ============

export const GEMINI_MODEL_KEY = "gemini-model";
export const GEMINI_MODEL_DEFAULT = "gemini-2.5-flash";

export function getStoredGeminiModel(): string {
  if (typeof window === "undefined") return GEMINI_MODEL_DEFAULT;
  const stored = localStorage.getItem(GEMINI_MODEL_KEY);
  if (stored === "gemini-2.0-flash" || stored === "gemini-2.5-flash" || stored === "gemini-3-flash-preview") return stored;
  return GEMINI_MODEL_DEFAULT;
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
}
