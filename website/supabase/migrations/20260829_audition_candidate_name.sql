-- Audiții: lecțiile de probă nu mai sunt legate de o fișă de elev existentă —
-- se introduce direct un nume, fără FK către students/teachers.
ALTER TABLE auditions ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS candidate_name text;
