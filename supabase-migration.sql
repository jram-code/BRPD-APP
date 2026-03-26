-- BRPD Inspector — Supabase Schema Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  reference_number TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  bc_body TEXT NOT NULL DEFAULT '',
  bc_contact TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT 'Isles Safety Ltd',
  inspector TEXT NOT NULL DEFAULT '',
  template_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  visit_number INTEGER NOT NULL DEFAULT 1,
  date DATE,
  inspector_name TEXT NOT NULL DEFAULT '',
  site_contact TEXT NOT NULL DEFAULT '',
  weather TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  next_visit_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspections_project_id ON inspections(project_id);

-- Check items table
CREATE TABLE IF NOT EXISTS check_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  ref TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'pass', 'fail', 'na')),
  notes TEXT NOT NULL DEFAULT '',
  priority BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_check_items_inspection_id ON check_items(inspection_id);

-- Photos metadata table (actual files stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_item_id UUID NOT NULL REFERENCES check_items(id) ON DELETE CASCADE,
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  item_ref TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL DEFAULT '',
  thumbnail_base64 TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photos_check_item_id ON photos(check_item_id);
CREATE INDEX IF NOT EXISTS idx_photos_inspection_id ON photos(inspection_id);

-- Disable RLS for single-user setup (no auth required)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth)
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on inspections" ON inspections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on check_items" ON check_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on photos" ON photos FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for inspection photos
-- NOTE: Run this separately in the Supabase Dashboard:
-- Go to Storage → Create new bucket → Name: "inspection-photos" → Public: Yes
