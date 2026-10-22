-- Solfegiu is taught in GROUPS (mică/medie/mare), not one row per student —
-- a recurring schedule can now represent an entire group's weekly class
-- (student_id null, group_name set) instead of always being tied to one
-- specific student. Individual-student schedules (every other instrument)
-- are unaffected — student_id stays required for those, group_name null.
ALTER TABLE recurring_schedules ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE recurring_schedules ADD COLUMN IF NOT EXISTS group_name text CHECK (group_name IN ('mica', 'medie', 'mare'));

-- Generating a group's weekly session now creates one `lessons` row PER
-- student currently in that group, for the same date — so the uniqueness
-- key must include student_id too, not just (recurring_schedule_id, date)
-- (which used to assume exactly one student per schedule+date).
DROP INDEX IF EXISTS lessons_recurring_date_uniq;
CREATE UNIQUE INDEX IF NOT EXISTS lessons_recurring_date_student_uniq
  ON lessons (recurring_schedule_id, date, student_id) WHERE recurring_schedule_id IS NOT NULL;
