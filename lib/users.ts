/**
 * Authentication/users storage — Supabase-backed (shared with the rest of the
 * app's business data), so an approved account survives a cold start instead
 * of living in the old per-instance SQLite file. Function names/shapes match
 * the previous lib/db.ts user helpers exactly, so every caller is unchanged
 * apart from awaiting them (Supabase calls are async; SQLite's weren't).
 */
import { supabase } from './supabase';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string | null;
  status: 'pending' | 'approved' | 'rejected';
  teacher_id: number | null;
  student_id: number | null;
  /** Every student fișă this account can see — student_id (if set) plus any
   *  extra siblings linked via user_student_links. Always use this (not the
   *  singular student_id) when checking what a student-role account may access. */
  student_ids: number[];
  created_at: string;
}

interface FullUserRow extends UserRow {
  password_hash: string | null;
  google_id: string | null;
}

const PUBLIC_COLUMNS = 'id, name, email, role, status, teacher_id, student_id, created_at';

/**
 * Attaches `student_ids` (the full linked set) to rows already carrying a
 * `student_id`. Falls back to just `[student_id]` if user_student_links
 * doesn't exist yet (migration not applied) — never hard-fails callers.
 */
async function withLinkedStudentIds<T extends { id: number; student_id: number | null }>(rows: T[]): Promise<(T & { student_ids: number[] })[]> {
  const fallback = () => rows.map(r => ({ ...r, student_ids: r.student_id != null ? [r.student_id] : [] }));
  if (rows.length === 0) return [];
  const { data, error } = await supabase.from('user_student_links').select('user_id, student_id').in('user_id', rows.map(r => r.id));
  if (error) return fallback();
  const extra = new Map<number, number[]>();
  for (const row of (data ?? []) as { user_id: number; student_id: number }[]) {
    (extra.get(row.user_id) ?? extra.set(row.user_id, []).get(row.user_id)!).push(row.student_id);
  }
  return rows.map(r => {
    const ex = extra.get(r.id) ?? [];
    return { ...r, student_ids: r.student_id != null ? [r.student_id, ...ex.filter(x => x !== r.student_id)] : ex };
  });
}

export async function getUserByEmail(email: string): Promise<FullUserRow | undefined> {
  const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  return (data as FullUserRow) ?? undefined;
}

export async function getUserById(id: number): Promise<UserRow | undefined> {
  const { data } = await supabase.from('users').select(PUBLIC_COLUMNS).eq('id', id).maybeSingle();
  if (!data) return undefined;
  const [withLinks] = await withLinkedStudentIds([data as UserRow]);
  return withLinks;
}

export async function getAllUsers(status?: string): Promise<UserRow[]> {
  let query = supabase.from('users').select(PUBLIC_COLUMNS).order('id', { ascending: true });
  if (status) query = query.eq('status', status);
  const { data } = await query;
  return withLinkedStudentIds((data ?? []) as UserRow[]);
}

const MIGRATION_HINT = 'Rulează migrarea supabase/migrations/20261016_user_student_links.sql în Supabase, apoi încearcă din nou.';

/**
 * Links a student fișă to an account. The FIRST one becomes the primary
 * (users.student_id, same single-link path every other piece of code already
 * understands); any fișă added after that is an EXTRA sibling link, stored in
 * user_student_links — which requires that table's migration to be applied.
 */
export async function linkStudent(userId: number, studentId: number): Promise<void> {
  const { data: user, error: userErr } = await supabase.from('users').select('student_id').eq('id', userId).maybeSingle();
  if (userErr) throw new Error(userErr.message);
  if (user?.student_id == null) {
    const { error } = await supabase.from('users').update({ student_id: studentId }).eq('id', userId);
    if (error) throw new Error(error.message);
    return;
  }
  if (user.student_id === studentId) return; // already the primary link
  const { error } = await supabase.from('user_student_links').upsert({ user_id: userId, student_id: studentId }, { onConflict: 'user_id,student_id' });
  if (error) throw new Error(MIGRATION_HINT);
}

/**
 * Removes one linked student fișă. If it was the PRIMARY one (users.student_id),
 * another remaining link (if any) is promoted to primary, so student_id stays
 * in sync with student_ids for any older code that still reads it directly.
 */
export async function unlinkStudent(userId: number, studentId: number): Promise<void> {
  const { data: user, error: userErr } = await supabase.from('users').select('student_id').eq('id', userId).maybeSingle();
  if (userErr) throw new Error(userErr.message);
  if (user?.student_id === studentId) {
    const { data: remaining, error: readErr } = await supabase.from('user_student_links').select('student_id').eq('user_id', userId).limit(1).maybeSingle();
    if (readErr) throw new Error(MIGRATION_HINT);
    const { error } = await supabase.from('users').update({ student_id: remaining?.student_id ?? null }).eq('id', userId);
    if (error) throw new Error(error.message);
    if (remaining) await supabase.from('user_student_links').delete().eq('user_id', userId).eq('student_id', remaining.student_id);
  } else {
    const { error } = await supabase.from('user_student_links').delete().eq('user_id', userId).eq('student_id', studentId);
    if (error) throw new Error(MIGRATION_HINT);
  }
}

export async function createUser(data: { name: string; email: string; password_hash: string; role?: string | null; status?: string }): Promise<UserRow | undefined> {
  const { data: row, error } = await supabase
    .from('users')
    .insert({ name: data.name, email: data.email, password_hash: data.password_hash, role: data.role ?? null, status: data.status ?? 'pending' })
    .select(PUBLIC_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return row as UserRow;
}

export async function approveUser(id: number, role: string, teacherId?: number | null, studentId?: number | null): Promise<UserRow | undefined> {
  const update: Record<string, unknown> = { status: 'approved', role };
  if (role === 'teacher' && teacherId != null) update.teacher_id = teacherId;
  if (role === 'student' && studentId != null) update.student_id = studentId;
  await supabase.from('users').update(update).eq('id', id);
  return getUserById(id);
}

export async function rejectUser(id: number): Promise<UserRow | undefined> {
  await supabase.from('users').update({ status: 'rejected' }).eq('id', id);
  return getUserById(id);
}

/**
 * Changes an already-approved account's role and, for teacher/student, its
 * linked fișă — the only place that can be done once approval already
 * happened (Approvals only offers the link while a request is still
 * pending; "fără asociere, poate fi setată mai târziu" would otherwise be a
 * promise with no way to follow through on).
 */
export async function updateUserRole(id: number, role: string, teacherId?: number | null, studentId?: number | null): Promise<UserRow | undefined> {
  const update: Record<string, unknown> = { role };
  if (teacherId !== undefined) update.teacher_id = role === 'teacher' ? teacherId : null;
  if (studentId !== undefined) update.student_id = role === 'student' ? studentId : null;
  await supabase.from('users').update(update).eq('id', id);
  // Moving away from 'student' entirely drops every extra sibling link too —
  // an account that's no longer a student account shouldn't retain phantom ones.
  if (role !== 'student') await supabase.from('user_student_links').delete().eq('user_id', id);
  return getUserById(id);
}

export async function updateUserPassword(id: number, passwordHash: string): Promise<void> {
  await supabase.from('users').update({ password_hash: passwordHash }).eq('id', id);
}

/** Deletes a login account. Does NOT touch the linked teacher/student fișă (a separate, much bigger action). */
export async function deleteUser(id: number): Promise<void> {
  await supabase.from('users').delete().eq('id', id);
}

export async function findOrCreateGoogleUser(googleId: string, name: string, email: string): Promise<UserRow> {
  const { data: byGoogle } = await supabase.from('users').select(PUBLIC_COLUMNS).eq('google_id', googleId).maybeSingle();
  if (byGoogle) return byGoogle as UserRow;

  const { data: byEmail } = await supabase.from('users').select(PUBLIC_COLUMNS).eq('email', email).maybeSingle();
  if (byEmail) {
    await supabase.from('users').update({ google_id: googleId }).eq('id', byEmail.id);
    return byEmail as UserRow;
  }

  const { data: created, error } = await supabase
    .from('users')
    .insert({ name, email, google_id: googleId, password_hash: null, role: null, status: 'pending' })
    .select(PUBLIC_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return created as UserRow;
}
