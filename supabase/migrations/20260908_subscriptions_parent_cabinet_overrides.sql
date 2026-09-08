-- Elevi: mai multe abonamente (unul per instrument) + date de contact părinte.
ALTER TABLE students ADD COLUMN IF NOT EXISTS subscriptions jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone text;

-- Program Privat: excepție punctuală (o singură dată) la asignarea
-- profesor↔cabinet, separată de șablonul săptămânal recurent
-- (cabinet_teacher_assignments, cheie pe day_of_week).
CREATE TABLE IF NOT EXISTS cabinet_teacher_overrides (
  id         bigserial PRIMARY KEY,
  cabinet_id bigint NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  date       date   NOT NULL,
  teacher_id bigint REFERENCES teachers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (cabinet_id, date)
);
ALTER TABLE cabinet_teacher_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on cabinet_teacher_overrides" ON cabinet_teacher_overrides;
CREATE POLICY "Allow all on cabinet_teacher_overrides" ON cabinet_teacher_overrides FOR ALL TO anon USING (true) WITH CHECK (true);
