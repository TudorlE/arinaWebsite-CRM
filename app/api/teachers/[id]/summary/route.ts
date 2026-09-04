import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole, restrictToOwnTeacher } from '@/lib/roleGuard';
import { getAllLessons, aggregateByTeacher } from '@/lib/scheduleStats';

/** Lifetime lesson breakdown + students worked with + total money brought — the "Detalii" popup. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { id } = await params;
  const teacherId = Number(id);

  const guard = restrictToOwnTeacher(ctx!, teacherId);
  if (guard) return guard;

  try {
    const rows = await getAllLessons({ teacherId });
    const stats = aggregateByTeacher(rows)[0] ?? {
      teacher_id: teacherId, total: 0, scheduled: 0, completed: 0, cancelled: 0, recovered: 0,
      present: 0, excused_absence: 0, unexcused_absence: 0, students: [],
    };

    // Money brought = paid payments from students currently assigned to this teacher.
    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('amount, students!inner(teacher_id)')
      .eq('status', 'paid')
      .eq('students.teacher_id', teacherId);
    if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

    const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

    // Înlocuiri făcute de acest profesor (a ținut lecția în locul titularului).
    let replacements: { date: string; time: string; student: string | null; discipline: string | null; titular: string | null }[] = [];
    try {
      const { data: repl } = await supabase
        .from('lessons')
        .select('date, time, discipline, students(name), teachers!lessons_teacher_id_fkey(name)')
        .eq('replacement_teacher_id', teacherId)
        .order('date', { ascending: false })
        .limit(60);
      replacements = ((repl ?? []) as unknown[]).map(row => {
        const r = row as { date: string; time: string; discipline: string | null; students: { name: string } | { name: string }[] | null; teachers: { name: string } | { name: string }[] | null };
        const stu = Array.isArray(r.students) ? r.students[0] : r.students;
        const tea = Array.isArray(r.teachers) ? r.teachers[0] : r.teachers;
        return { date: r.date, time: r.time, student: stu?.name ?? null, discipline: r.discipline, titular: tea?.name ?? null };
      });
    } catch { /* column not migrated yet — ignore */ }

    return NextResponse.json({ stats, totalPaid, replacements });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 });
  }
}
