// ============ public_configs table — server/API only ============
import { supabaseAdmin } from "./supabase";

export interface PublicConfigRow {
  key: string;
  value: string | null;
  description: string | null;
}

export async function getPublicConfigs(): Promise<PublicConfigRow[]> {
  const { data, error } = await supabaseAdmin
    .from("public_configs")
    .select("key, value, description");

  if (error) {
    console.error("Error fetching public_configs:", error);
    return [];
  }
  return (data || []) as PublicConfigRow[];
}

export async function upsertPublicConfig(
  key: string,
  value: string,
  description?: string | null
): Promise<void> {
  const payload: { key: string; value: string; description?: string | null } = {
    key,
    value,
  };
  if (description !== undefined) payload.description = description;

  const { error } = await supabaseAdmin
    .from("public_configs")
    .upsert(payload, { onConflict: "key" });

  if (error) {
    console.error("Error upserting public_config:", error);
    throw new Error(error.message);
  }
}

export async function upsertPublicConfigs(
  entries: Array<{ key: string; value: string; description?: string | null }>
): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await supabaseAdmin
    .from("public_configs")
    .upsert(entries, { onConflict: "key" });

  if (error) {
    console.error("Error upserting public_configs:", error);
    throw new Error(error.message);
  }
}
