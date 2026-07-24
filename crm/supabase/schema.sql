-- ArryMusic CRM — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query

-- ── Teachers ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id        bigserial PRIMARY KEY,
  name      text      NOT NULL,
  email     text      UNIQUE NOT NULL,
  phone     text,
  bio       text,
  created_at timestamptz DEFAULT now()
);

-- ── Students ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id          bigserial PRIMARY KEY,
  name        text      NOT NULL,
  age         integer,
  phone       text,
  email       text      UNIQUE,
  instrument  text,
  level       text      CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  monthly_fee numeric(10,2) DEFAULT 100,
  teacher_id  bigint    REFERENCES teachers(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

-- ── Lessons ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id         bigserial PRIMARY KEY,
  student_id bigint NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id bigint NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  date       date   NOT NULL,
  time       text   NOT NULL,          -- stored as 'HH:MM'
  duration   integer DEFAULT 60,       -- minutes
  status     text    DEFAULT 'scheduled'
             CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes      text,
  created_at timestamptz DEFAULT now()
);

-- ── Payments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id           bigserial PRIMARY KEY,
  student_id   bigint NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount       numeric(10,2) NOT NULL,
  month        integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year         integer NOT NULL,
  status       text    DEFAULT 'unpaid'
               CHECK (status IN ('paid', 'unpaid', 'partial')),
  payment_date date,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

-- ── Student Notes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_notes (
  id         bigserial PRIMARY KEY,
  student_id bigint NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  content    text   NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ── Enable RLS on all tables ──────────────────────────────────
ALTER TABLE teachers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- ── Events / Recitals ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id          bigserial PRIMARY KEY,
  title       text NOT NULL,
  description text,
  date        date NOT NULL,
  time        text,
  type        text DEFAULT 'recital'
              CHECK (type IN ('recital', 'concert', 'exam', 'workshop', 'masterclass', 'other')),
  location    text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ── Cabinets (physical rooms) ────────────────────────────────
CREATE TABLE IF NOT EXISTS cabinets (
  id         bigserial PRIMARY KEY,
  name       text      NOT NULL,
  color      text      DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

-- ── Cabinet–Teacher assignments (weekly recurring schedule) ──
-- Which teacher works in which cabinet on which day of week
CREATE TABLE IF NOT EXISTS cabinet_teacher_assignments (
  id          bigserial PRIMARY KEY,
  cabinet_id  bigint    NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  teacher_id  bigint    REFERENCES teachers(id) ON DELETE SET NULL,
  day_of_week integer   NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon … 6=Sat
  UNIQUE(cabinet_id, day_of_week)
);

ALTER TABLE cabinets                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet_teacher_assignments ENABLE ROW LEVEL SECURITY;

-- ── Migration: add cabinet_id to lessons ──────────────────────
-- Run this once in Supabase SQL Editor if the column doesn't exist yet:
-- ALTER TABLE lessons ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES cabinets(id) ON DELETE SET NULL;

-- ── Permissive policies ───────────────────────────────────────
-- App handles auth via its own JWT/cookie system.
-- These policies allow the publishable (anon) key full CRUD access.
CREATE POLICY "Allow all on teachers"                       ON teachers                       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on students"                       ON students                       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on lessons"                        ON lessons                        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on payments"                       ON payments                       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on student_notes"                  ON student_notes                  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on events"                         ON events                         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cabinets"                       ON cabinets                       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cabinet_teacher_assignments"    ON cabinet_teacher_assignments     FOR ALL TO anon USING (true) WITH CHECK (true);
