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
  created_at: string;
}

interface FullUserRow extends UserRow {
  password_hash: string | null;
  google_id: string | null;
}

const PUBLIC_COLUMNS = 'id, name, email, role, status, teacher_id, student_id, created_at';

export async function getUserByEmail(email: string): Promise<FullUserRow | undefined> {
  const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  return (data as FullUserRow) ?? undefined;
}

export async function getUserById(id: number): Promise<UserRow | undefined> {
  const { data } = await supabase.from('users').select(PUBLIC_COLUMNS).eq('id', id).maybeSingle();
  return (data as UserRow) ?? undefined;
}

export async function getAllUsers(status?: string): Promise<UserRow[]> {
  let query = supabase.from('users').select(PUBLIC_COLUMNS).order('id', { ascending: true });
  if (status) query = query.eq('status', status);
  const { data } = await query;
  return (data ?? []) as UserRow[];
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

export async function updateUserRole(id: number, role: string): Promise<UserRow | undefined> {
  await supabase.from('users').update({ role }).eq('id', id);
  return getUserById(id);
}

export async function updateUserPassword(id: number, passwordHash: string): Promise<void> {
  await supabase.from('users').update({ password_hash: passwordHash }).eq('id', id);
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
