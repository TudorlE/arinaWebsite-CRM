import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireRole, restrictToOwnTeacher } from '@/lib/roleGuard';
import { getLessonsInMonth, aggregateByStudent } from '@/lib/scheduleStats';

/** Live monthly per-student stats (Elevi General profile card + Elevi Frecvență). */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month trebuie în format YYYY-MM' }, { status: 400 });
  }

  const studentId = searchParams.get('student_id');
  let teacherId = searchParams.get('teacher_id');
  const discipline = searchParams.get('discipline');

  if (ctx!.role === 'teacher') {
    const guard = restrictToOwnTeacher(ctx!, teacherId ? Number(teacherId) : undefined);
    if (guard) return guard;
    teacherId = String(ctx!.teacherId);
  }

  try {
    const rows = await getLessonsInMonth(month, {
      studentId: studentId ? Number(studentId) : undefined,
      teacherId: teacherId ? Number(teacherId) : undefined,
      discipline: discipline ?? undefined,
    });
    return NextResponse.json({ stats: aggregateByStudent(rows) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}
