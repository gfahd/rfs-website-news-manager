-- Chat widget and live website config (key/value). Separate from CMS settings.
CREATE TABLE IF NOT EXISTS public_configs (
  key text PRIMARY KEY,
  value text,
  description text
);

-- Optional: add updated_at if you want "Last updated" per row (we can use a single updated_at column or track per key).
-- For simplicity we use key/value only; "Last updated" can be shown from client-side after save.
