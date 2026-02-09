-- Add ai_models column to settings table so custom AI models persist.
-- Run in Supabase Dashboard → SQL Editor if new models disappear after save.

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS ai_models jsonb DEFAULT '[{"value":"gemini-2.5-flash","label":"Gemini 2.5 Flash"},{"value":"gemini-2.0-flash","label":"Gemini 2.0 Flash"}]'::jsonb;

-- Backfill existing row(s) so ai_models is not null
UPDATE settings
SET ai_models = COALESCE(ai_models, '[{"value":"gemini-2.5-flash","label":"Gemini 2.5 Flash"},{"value":"gemini-2.0-flash","label":"Gemini 2.0 Flash"}]'::jsonb)
WHERE ai_models IS NULL;
