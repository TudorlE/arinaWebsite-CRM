import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireRole, restrictToOwnTeacher } from '@/lib/roleGuard';
import { getLessonsInMonth, aggregateByTeacher } from '@/lib/scheduleStats';

/** Live monthly per-teacher stats (Profesori Frecvență) — lesson counts + students worked with. */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month trebuie în format YYYY-MM' }, { status: 400 });
  }

  const discipline = searchParams.get('discipline');
  let teacherId: number | undefined;

  if (ctx!.role === 'teacher') {
    const guard = restrictToOwnTeacher(ctx!);
    if (guard) return guard;
    teacherId = ctx!.teacherId!;
  }

  try {
    const rows = await getLessonsInMonth(month, { teacherId, discipline: discipline ?? undefined });
    return NextResponse.json({ stats: aggregateByTeacher(rows) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}
