export const GEMINI_MODEL_KEY = "gemini-model";
export const GEMINI_MODEL_DEFAULT = "gemini-2.5-flash";

export function getStoredGeminiModel(): string {
  if (typeof window === "undefined") return GEMINI_MODEL_DEFAULT;
  const stored = localStorage.getItem(GEMINI_MODEL_KEY);
  if (stored === "gemini-2.0-flash" || stored === "gemini-2.5-flash" || stored === "gemini-3-flash-preview") return stored;
  return GEMINI_MODEL_DEFAULT;
}
