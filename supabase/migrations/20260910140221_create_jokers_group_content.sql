/*
# Create Joker's Group website content and enquiry data

1. New Tables
- `site_settings` stores editable hero, about, CTA, and contact content for the public website.
- `portfolio_projects` stores public project entries and image URLs managed by administrators.
- `quote_enquiries` stores customer quote requests for administrator review.
- `site_admins` stores the small allowlist of authenticated administrator accounts.

2. Security
- Row level security is enabled on every new table.
- Public visitors can read published website content and submit quote enquiries.
- Only authenticated administrators can create, update, delete content or read enquiries.
- The first authenticated account can claim administrator access once, through a guarded database function.

3. Important notes
- Uploaded files are represented by URLs so storage can be connected without changing the public page structure.
- No customer credentials or administrator credentials are stored in website code.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quote_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organisation text NOT NULL DEFAULT '',
  phone text NOT NULL,
  email text NOT NULL,
  service text NOT NULL,
  description text NOT NULL,
  quantity text NOT NULL DEFAULT '',
  timeframe text NOT NULL DEFAULT '',
  artwork_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admins_insert_site_settings" ON site_settings;
CREATE POLICY "admins_insert_site_settings" ON site_settings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_update_site_settings" ON site_settings;
CREATE POLICY "admins_update_site_settings" ON site_settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_delete_site_settings" ON site_settings;
CREATE POLICY "admins_delete_site_settings" ON site_settings FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "public_read_portfolio" ON portfolio_projects;
CREATE POLICY "public_read_portfolio" ON portfolio_projects FOR SELECT TO anon, authenticated USING (featured = true OR EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_insert_portfolio" ON portfolio_projects;
CREATE POLICY "admins_insert_portfolio" ON portfolio_projects FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_update_portfolio" ON portfolio_projects;
CREATE POLICY "admins_update_portfolio" ON portfolio_projects FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_delete_portfolio" ON portfolio_projects;
CREATE POLICY "admins_delete_portfolio" ON portfolio_projects FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "public_submit_quotes" ON quote_enquiries;
CREATE POLICY "public_submit_quotes" ON quote_enquiries FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');
DROP POLICY IF EXISTS "admins_read_quotes" ON quote_enquiries;
CREATE POLICY "admins_read_quotes" ON quote_enquiries FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_update_quotes" ON quote_enquiries;
CREATE POLICY "admins_update_quotes" ON quote_enquiries FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_delete_quotes" ON quote_enquiries;
CREATE POLICY "admins_delete_quotes" ON quote_enquiries FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_read_admins" ON site_admins;
CREATE POLICY "admins_read_admins" ON site_admins FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  IF EXISTS (SELECT 1 FROM site_admins) THEN
    RETURN EXISTS (SELECT 1 FROM site_admins WHERE user_id = auth.uid());
  END IF;
  INSERT INTO site_admins (user_id) VALUES (auth.uid());
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION claim_first_admin() FROM anon;
GRANT EXECUTE ON FUNCTION claim_first_admin() TO authenticated;

INSERT INTO site_settings (key, value) VALUES
('hero', '{"eyebrow":"JOKERS GROUP • GEELONG","title":"MAKE YOUR BRAND IMPOSSIBLE TO IGNORE.","description":"From signage and vehicle graphics to uniforms, merchandise, stickers and print — Joker''s Group helps Geelong businesses stand out."}'::jsonb),
('about', '{"title":"MORE THAN JUST SIGNAGE.","body":"Joker''s Group is a Geelong business helping local businesses, organisations, teams and individuals bring their ideas to life. From signage and vehicle graphics to uniforms, clothing, promotional merchandise, stickers and labels, we''re here to help your brand make an impact."}'::jsonb),
('contact', '{"email":"Rhett.jokersgroup@gmail.com","facebook":"https://www.facebook.com/Jokersgroup/"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS portfolio_projects_category_idx ON portfolio_projects(category);
CREATE INDEX IF NOT EXISTS quote_enquiries_created_at_idx ON quote_enquiries(created_at DESC);