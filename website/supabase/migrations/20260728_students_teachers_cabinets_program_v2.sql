-- Elevi / Profesori / Cabinete / Program v2
-- Run this once in the Supabase SQL Editor for this project.
-- Idempotent: safe to re-run.

-- ── Students: home cabinet, quick note, active/inactive status ─────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES cabinets(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','paused'));

-- ── Lessons: add 'recovered' as a valid status (Recuperări) ────────────────
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_status_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_status_check CHECK (status IN ('scheduled','completed','cancelled','recovered'));

-- ── Cabinets: manual per (cabinet, day-of-week) Ocupat/Liber flag ──────────
-- Same shape as the existing cabinet_teacher_assignments table; editable any
-- time, no locking after save.
CREATE TABLE IF NOT EXISTS cabinet_day_status (
  id          bigserial PRIMARY KEY,
  cabinet_id  bigint NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  status      text NOT NULL DEFAULT 'liber' CHECK (status IN ('liber','ocupat')),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(cabinet_id, day_of_week)
);
ALTER TABLE cabinet_day_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on cabinet_day_status" ON cabinet_day_status;
CREATE POLICY "Allow all on cabinet_day_status" ON cabinet_day_status FOR ALL TO anon USING (true) WITH CHECK (true);
