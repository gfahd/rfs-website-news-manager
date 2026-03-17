-- Allowed login emails: only these Google account emails can sign in to the CMS.
-- Managed from the Settings page in the admin app.

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS allowed_login_emails text[] DEFAULT '{}';

-- Optional: seed with initial allowed emails (adjust as needed)
-- UPDATE settings
-- SET allowed_login_emails = ARRAY['info@redflagsecurity.ca', 'georges.fahd@gmail.com']
-- WHERE id = 'global' AND (allowed_login_emails IS NULL OR allowed_login_emails = '{}');
