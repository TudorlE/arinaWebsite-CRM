-- The partial unique index from the previous migration (WHERE recurring_schedule_id
-- IS NOT NULL) can't be used by Postgres's ON CONFLICT inference without an exact
-- matching WHERE clause on the upsert itself, which Supabase's client can't add —
-- so group-schedule lesson generation failed with "no unique or exclusion
-- constraint matching the ON CONFLICT specification". Dropping the WHERE clause
-- is safe: NULL recurring_schedule_id values (ad-hoc, non-recurring lessons)
-- never collide with each other under a unique index, since SQL never treats
-- NULL = NULL as a match.
DROP INDEX IF EXISTS lessons_recurring_date_student_uniq;
CREATE UNIQUE INDEX IF NOT EXISTS lessons_recurring_date_student_uniq
  ON lessons (recurring_schedule_id, date, student_id);
