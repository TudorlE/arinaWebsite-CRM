-- Înlocuiri de profesor pentru o lecție.
-- Când un alt profesor ține lecția în locul celui titular, se salvează aici.

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS replacement_teacher_id bigint
  REFERENCES teachers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS lessons_replacement_teacher_idx
  ON lessons (replacement_teacher_id);
