-- Fixed Schedule, General Schedule, Attendance & Auditions
-- Run this once in the Supabase SQL Editor for this project.
-- Idempotent: safe to re-run.

-- ── Recurring lesson rules ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id              bigserial PRIMARY KEY,
  student_id      bigint NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id      bigint NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  discipline      text,
  cabinet_id      bigint REFERENCES cabinets(id) ON DELETE SET NULL,
  day_of_week     integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun..6=Sat
  start_time      text NOT NULL,   -- 'HH:MM'
  end_time        text NOT NULL,   -- 'HH:MM'
  notes           text,
  active          boolean NOT NULL DEFAULT true,
  generated_until date, -- last calendar date already materialized into `lessons`
  created_at      timestamptz DEFAULT now()
);

-- ── Link generated lessons back to their rule + track manual per-occurrence edits ──
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS recurring_schedule_id bigint REFERENCES recurring_schedules(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_customized boolean NOT NULL DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS discipline text;

-- Guarantee multi-month generation is idempotent (Feature 2 + 3 safety net)
CREATE UNIQUE INDEX IF NOT EXISTS lessons_recurring_date_uniq
  ON lessons (recurring_schedule_id, date) WHERE recurring_schedule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS lessons_date_idx      ON lessons (date);
CREATE INDEX IF NOT EXISTS lessons_teacher_idx    ON lessons (teacher_id);
CREATE INDEX IF NOT EXISTS lessons_recurring_idx  ON lessons (recurring_schedule_id);

-- ── Attendance: one row per lesson occurrence ───────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id             bigserial PRIMARY KEY,
  lesson_id      bigint NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
  status         text NOT NULL CHECK (status IN ('present','excused_absence','unexcused_absence','late')),
  notes          text,
  marked_by_name text, -- denormalized; auth users live in a separate SQLite DB, no real FK possible
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attendance_lesson_idx ON attendance (lesson_id);

-- ── Auditions: fully separate module ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditions (
  id          bigserial PRIMARY KEY,
  student_id  bigint NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id  bigint REFERENCES teachers(id) ON DELETE SET NULL,
  discipline  text,
  date        date NOT NULL,
  time        text NOT NULL,
  duration    integer NOT NULL DEFAULT 30,
  notes       text,
  result      text,
  status      text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auditions_date_idx    ON auditions (date);
CREATE INDEX IF NOT EXISTS auditions_student_idx ON auditions (student_id);

-- ── Same permissive-RLS convention as every existing table in schema.sql ───
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditions           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all" ON recurring_schedules;
DROP POLICY IF EXISTS "allow all" ON attendance;
DROP POLICY IF EXISTS "allow all" ON auditions;

CREATE POLICY "allow all" ON recurring_schedules FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON attendance          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON auditions           FOR ALL TO anon USING (true) WITH CHECK (true);
