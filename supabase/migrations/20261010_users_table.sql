-- Real login system: user accounts now live in Supabase instead of the
-- per-instance SQLite file they used to sit in (which was wiped on every
-- Vercel cold start, making "real login" silently flaky in production).
--
-- Flow: anyone can POST /api/auth/register → row is created with
-- role = NULL, status = 'pending'. An admin then approves them from
-- /admin/approvals, picking a role ('admin' is never assignable from the
-- UI — set it manually here) and, for 'teacher'/'student', linking the
-- account to its teacher_id/student_id row. Only 'approved' users can log
-- in or keep an existing session valid (re-checked on every request).
CREATE TABLE IF NOT EXISTS users (
  id            bigserial PRIMARY KEY,
  name          text        NOT NULL,
  email         text        UNIQUE NOT NULL,
  password_hash text,                              -- null for Google-only accounts
  google_id     text        UNIQUE,
  role          text        CHECK (role IN ('admin', 'administrator', 'teacher', 'student')),
  status        text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  teacher_id    bigint      REFERENCES teachers(id) ON DELETE SET NULL,
  student_id    bigint      REFERENCES students(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Same "allow all to anon" pattern as every other table — the app only ever
-- holds the anon/publishable key, and all real access control (who can read/
-- write what) is enforced in the API layer via lib/roleGuard.ts.
DROP POLICY IF EXISTS "Allow all on users" ON users;
CREATE POLICY "Allow all on users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
