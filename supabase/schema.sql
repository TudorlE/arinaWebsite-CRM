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
  instruments text[]    NOT NULL DEFAULT '{}',
  level       text      CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  monthly_fee numeric(10,2) DEFAULT 100,
  teacher_id  bigint    REFERENCES teachers(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);
-- Idempotent fix for tables created by an earlier version of this file
-- (had a singular `instrument text` column instead of the array the app uses).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'instrument') THEN
    ALTER TABLE students ADD COLUMN IF NOT EXISTS instruments text[] NOT NULL DEFAULT '{}';
    UPDATE students SET instruments = ARRAY[instrument] WHERE instrument IS NOT NULL AND instruments = '{}';
    ALTER TABLE students DROP COLUMN instrument;
  END IF;
END $$;

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
               CHECK (status IN ('paid', 'unpaid', 'partial', 'overdue')),
  due_date     date,
  payment_date date,
  paid_at      timestamptz,
  notes        text,
  created_at   timestamptz DEFAULT now()
);
-- Idempotent fixes for tables created by an earlier version of this file.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('paid', 'unpaid', 'partial', 'overdue'));

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
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES cabinets(id) ON DELETE SET NULL;

-- ── Permissive policies ───────────────────────────────────────
-- App handles auth via its own JWT/cookie system.
-- These policies allow the publishable (anon) key full CRUD access.
-- Dropped-then-created so this whole file is safe to re-run any time.
DROP POLICY IF EXISTS "Allow all on teachers"                    ON teachers;
DROP POLICY IF EXISTS "Allow all on students"                    ON students;
DROP POLICY IF EXISTS "Allow all on lessons"                     ON lessons;
DROP POLICY IF EXISTS "Allow all on payments"                    ON payments;
DROP POLICY IF EXISTS "Allow all on student_notes"               ON student_notes;
DROP POLICY IF EXISTS "Allow all on events"                      ON events;
DROP POLICY IF EXISTS "Allow all on cabinets"                    ON cabinets;
DROP POLICY IF EXISTS "Allow all on cabinet_teacher_assignments" ON cabinet_teacher_assignments;
CREATE POLICY "Allow all on teachers"                       ON teachers                       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on students"                       ON students                       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on lessons"                        ON lessons                        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on payments"                       ON payments                       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on student_notes"                  ON student_notes                  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on events"                         ON events                         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cabinets"                       ON cabinets                       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cabinet_teacher_assignments"    ON cabinet_teacher_assignments     FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── Migration: registrations (public site contact form leads) ────
-- Already live in Supabase; not originally captured in this file.
CREATE TABLE IF NOT EXISTS registrations (
  id         bigserial PRIMARY KEY,
  name       text NOT NULL,
  phone      text,
  email      text,
  age        text,
  course     text,
  message    text,
  status     text DEFAULT 'nou' CHECK (status IN ('nou', 'contactat', 'inscris', 'anulat')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on registrations" ON registrations;
CREATE POLICY "Allow all on registrations" ON registrations FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── Fixed Schedule / General Schedule / Attendance / Auditions ───
-- See migrations/20260727_recurring_schedule_attendance_auditions.sql for the
-- full, idempotent version of this migration (this block mirrors it so the
-- checked-in schema file stays in sync with what's actually live).

CREATE TABLE IF NOT EXISTS recurring_schedules (
  id              bigserial PRIMARY KEY,
  student_id      bigint NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id      bigint NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  discipline      text,
  cabinet_id      bigint REFERENCES cabinets(id) ON DELETE SET NULL,
  day_of_week     integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      text NOT NULL,
  end_time        text NOT NULL,
  notes           text,
  active          boolean NOT NULL DEFAULT true,
  generated_until date,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS recurring_schedule_id bigint REFERENCES recurring_schedules(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_customized boolean NOT NULL DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS discipline text;

CREATE UNIQUE INDEX IF NOT EXISTS lessons_recurring_date_uniq
  ON lessons (recurring_schedule_id, date) WHERE recurring_schedule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lessons_date_idx     ON lessons (date);
CREATE INDEX IF NOT EXISTS lessons_teacher_idx   ON lessons (teacher_id);
CREATE INDEX IF NOT EXISTS lessons_recurring_idx ON lessons (recurring_schedule_id);

CREATE TABLE IF NOT EXISTS attendance (
  id             bigserial PRIMARY KEY,
  lesson_id      bigint NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
  status         text NOT NULL CHECK (status IN ('present','excused_absence','unexcused_absence','late')),
  notes          text,
  marked_by_name text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attendance_lesson_idx ON attendance (lesson_id);

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

ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditions           ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on recurring_schedules" ON recurring_schedules;
DROP POLICY IF EXISTS "Allow all on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow all on auditions" ON auditions;
CREATE POLICY "Allow all on recurring_schedules" ON recurring_schedules FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on attendance"          ON attendance          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on auditions"           ON auditions           FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── Elevi / Profesori / Cabinete / Program v2 ─────────────────────
-- See migrations/20260728_students_teachers_cabinets_program_v2.sql for the
-- full, idempotent version of this migration.

ALTER TABLE students ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES cabinets(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','paused'));

ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_status_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_status_check CHECK (status IN ('scheduled','completed','cancelled','recovered'));

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

-- ── Replace raw "age" with actual date of birth ───────────────────
-- See migrations/20260826_birth_date_instead_of_age.sql

ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE students ALTER COLUMN age DROP NOT NULL;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS birth_date date;
