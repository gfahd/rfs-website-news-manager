import type { AIModelOption } from "@/lib/settings-client";

export const TONE_OPTIONS = [
  "Professional",
  "Friendly",
  "Technical",
  "Persuasive",
  "Conversational",
];

export const LENGTH_OPTIONS = [
  { value: "short", label: "Short ~400 words" },
  { value: "medium", label: "Medium ~800 words" },
  { value: "long", label: "Long ~1200 words" },
];

export const LINK_POLICY_OPTIONS = [
  { value: "internal_only", label: "Internal links only (recommended)" },
  { value: "no_links", label: "No links" },
  { value: "allow_all", label: "Allow all links" },
] as const;

export const DEFAULT_AI_MODELS: AIModelOption[] = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];
