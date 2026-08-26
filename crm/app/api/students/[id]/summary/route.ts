import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole, restrictToOwnTeacher } from '@/lib/roleGuard';
import { getAllLessons, aggregateByStudent } from '@/lib/scheduleStats';

/** Lifetime lesson/attendance breakdown + total money brought — the "Detalii" popup. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { id } = await params;
  const studentId = Number(id);

  if (ctx!.role === 'teacher') {
    const { data: student } = await supabase.from('students').select('teacher_id').eq('id', studentId).single();
    const guard = restrictToOwnTeacher(ctx!, student?.teacher_id);
    if (guard) return guard;
  }

  try {
    const rows = await getAllLessons({ studentId });
    const stats = aggregateByStudent(rows)[0] ?? {
      student_id: studentId, total: 0, scheduled: 0, completed: 0, cancelled: 0, recovered: 0,
      present: 0, excused_absence: 0, unexcused_absence: 0,
    };

    const { data: payments, error: payErr } = await supabase
      .from('payments').select('amount').eq('student_id', studentId).eq('status', 'paid');
    if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

    const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({ stats, totalPaid });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}
