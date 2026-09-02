-- Replace raw "age" with actual date of birth on students and teachers.
-- Run this once in the Supabase SQL Editor. Idempotent: safe to re-run.

ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE students ALTER COLUMN age DROP NOT NULL;

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS birth_date date;
