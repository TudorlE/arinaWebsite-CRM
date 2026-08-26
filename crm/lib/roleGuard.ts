/**
 * Server-side role/ownership checks for the new schedule/attendance/audition
 * routes. Existing routes (students, teachers, lessons, cabinets, ...) rely on
 * UI-level gating only (see Sidebar.tsx) — left untouched here on purpose.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, JWTPayload } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export interface AuthContext {
  auth: JWTPayload;
  role: string | null;
  teacherId: number | null;
}

/** Resolves the caller's auth + linked teacher_id (null for admin/student/unlinked teacher). */
export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const auth = await getAuthUser(request);
  if (!auth) return null;
  const user = getUserById(auth.userId);
  return { auth, role: user?.role ?? null, teacherId: user?.teacher_id ?? null };
}

/** Returns a 401/403 NextResponse if the caller's role isn't in `roles`, otherwise null. */
export function requireRole(ctx: AuthContext | null, roles: string[]): NextResponse | null {
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ctx.role || !roles.includes(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

/**
 * For teacher-role callers, forces the query/mutation to their own linked
 * teacher_id. Admins pass through untouched. Returns null (allowed) or a
 * 403 NextResponse when a teacher has no linked teacher_id yet, or tries to
 * act on a `targetTeacherId` that isn't their own.
 */
export function restrictToOwnTeacher(ctx: AuthContext, targetTeacherId?: number | null): NextResponse | null {
  if (ctx.role === 'admin') return null;
  if (ctx.role === 'teacher') {
    if (ctx.teacherId == null) {
      return NextResponse.json({ error: 'Contul tău de profesor nu este asociat unei fișe de profesor.' }, { status: 403 });
    }
    if (targetTeacherId != null && Number(targetTeacherId) !== ctx.teacherId) {
      return NextResponse.json({ error: 'Nu poți accesa datele altui profesor.' }, { status: 403 });
    }
    return null;
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
