export interface ChatWidgetConfig {
  enable_chat: boolean;
  enable_sales: boolean;
  enable_support: boolean;
  enable_estimates: boolean;
  header_title: string;
  welcome_message: string;
  business_hours: string;
  support_phone: string;
  url_sales: string;
  url_support: string;
  url_estimate: string;
}

export const CHAT_WIDGET_KEYS: (keyof ChatWidgetConfig)[] = [
  "enable_chat",
  "enable_sales",
  "enable_support",
  "enable_estimates",
  "header_title",
  "welcome_message",
  "business_hours",
  "support_phone",
  "url_sales",
  "url_support",
  "url_estimate",
];

const BOOLEAN_KEYS: (keyof ChatWidgetConfig)[] = [
  "enable_chat",
  "enable_sales",
  "enable_support",
  "enable_estimates",
];

const DEFAULT_CHAT_WIDGET_CONFIG: ChatWidgetConfig = {
  enable_chat: false,
  enable_sales: true,
  enable_support: true,
  enable_estimates: true,
  header_title: "",
  welcome_message: "",
  business_hours: "",
  support_phone: "",
  url_sales: "",
  url_support: "",
  url_estimate: "",
};

function parseBool(v: string | null | undefined): boolean {
  if (v === null || v === undefined) return false;
  const s = String(v).toLowerCase().trim();
  return s === "true" || s === "1" || s === "yes";
}

export function rowsToChatWidgetConfig(rows: Array<{ key: string; value: string | null }>): ChatWidgetConfig {
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.value != null) map.set(r.key, r.value);
  }
  const get = (k: keyof ChatWidgetConfig): string => map.get(k) ?? "";

  return {
    enable_chat: parseBool(get("enable_chat")),
    enable_sales: parseBool(get("enable_sales")),
    enable_support: parseBool(get("enable_support")),
    enable_estimates: parseBool(get("enable_estimates")),
    header_title: get("header_title"),
    welcome_message: get("welcome_message"),
    business_hours: get("business_hours"),
    support_phone: get("support_phone"),
    url_sales: get("url_sales"),
    url_support: get("url_support"),
    url_estimate: get("url_estimate"),
  };
}

export function chatWidgetConfigToRows(config: Partial<ChatWidgetConfig>): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = [];
  for (const k of CHAT_WIDGET_KEYS) {
    const v = config[k];
    if (v === undefined) continue;
    result.push({
      key: k,
      value: typeof v === "boolean" ? (v ? "true" : "false") : String(v ?? ""),
    });
  }
  return result;
}

export { DEFAULT_CHAT_WIDGET_CONFIG, BOOLEAN_KEYS };
