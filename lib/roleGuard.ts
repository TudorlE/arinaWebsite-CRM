/**
 * Server-side role/ownership checks, shared by every API route that needs to
 * know WHO is calling and restrict WHAT they can see to their own data.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, JWTPayload } from '@/lib/auth';
import { getUserById } from '@/lib/users';

export interface AuthContext {
  auth: JWTPayload;
  role: string | null;
  teacherId: number | null;
  /** Primary/first linked student — a representative id for any code that only needs one. */
  studentId: number | null;
  /** EVERY student fișă this account can see (siblings sharing one account included). Use this for access checks. */
  studentIds: number[];
}

/** Resolves the caller's auth + current role/teacher_id/student_id(s), read fresh
 * from the users table on every call — so a role change or approval takes
 * effect immediately, without waiting for the JWT to expire. */
export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const auth = await getAuthUser(request);
  if (!auth) return null;
  const user = await getUserById(auth.userId);
  if (!user || user.status !== 'approved') return null;
  return { auth, role: user.role ?? null, teacherId: user.teacher_id ?? null, studentId: user.student_id ?? null, studentIds: user.student_ids ?? [] };
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
  if (ctx.role === 'admin' || ctx.role === 'administrator') return null;
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

/**
 * For student-role callers, forces the query to their own linked student_id —
 * the register and lesson endpoints use this so a student can only ever read
 * (never write) their own attendance, never a classmate's. Admins pass
 * through untouched; every other role is forbidden (this is student-only data).
 */
export function restrictToOwnStudent(ctx: AuthContext, targetStudentId?: number | null): NextResponse | null {
  if (ctx.role === 'admin' || ctx.role === 'administrator') return null;
  if (ctx.role === 'student') {
    if (ctx.studentIds.length === 0) {
      return NextResponse.json({ error: 'Contul tău de elev nu este asociat unei fișe de elev.' }, { status: 403 });
    }
    if (targetStudentId != null && !ctx.studentIds.includes(Number(targetStudentId))) {
      return NextResponse.json({ error: 'Nu poți accesa datele altui elev.' }, { status: 403 });
    }
    return null;
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
