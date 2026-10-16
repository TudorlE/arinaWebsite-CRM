-- A single login account can now be linked to MORE than one student fișă —
-- e.g. two siblings coming to the same lessons, sharing one parent account.
-- users.student_id stays as the "primary"/first link (every existing account
-- keeps working unchanged); this table holds any ADDITIONAL links on top of
-- it. The full set an account can see is always: student_id (if set) + every
-- row here for that user — see lib/users.ts's getLinkedStudentIds().
CREATE TABLE IF NOT EXISTS user_student_links (
  user_id    bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id bigint NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, student_id)
);

ALTER TABLE user_student_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on user_student_links" ON user_student_links;
CREATE POLICY "Allow all on user_student_links" ON user_student_links FOR ALL TO anon USING (true) WITH CHECK (true);
