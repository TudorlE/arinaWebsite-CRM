-- ── Registru Frecvență: one assigned teacher per service/discipline ─────────
-- Shown above the register table; admin-only to change (enforced in the API
-- route, not here — same pattern as cabinet_teacher_assignments).
CREATE TABLE IF NOT EXISTS discipline_teachers (
  id          bigserial PRIMARY KEY,
  discipline  text NOT NULL UNIQUE,
  teacher_id  bigint REFERENCES teachers(id) ON DELETE SET NULL,
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE discipline_teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on discipline_teachers" ON discipline_teachers;
CREATE POLICY "Allow all on discipline_teachers" ON discipline_teachers FOR ALL TO anon USING (true) WITH CHECK (true);
