import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole, restrictToOwnTeacher } from '@/lib/roleGuard';
import { fetchShapedLesson } from '@/lib/lessonShape';
import { nextState, type MarkAction } from '@/lib/attendanceMarks';
import { DEFAULT_TIME_SLOTS } from '@/lib/timeSlots';
import type { StudentSubscription } from '@/lib/types';

const ACTIONS: MarkAction[] = ['present', 'excused_absence', 'unexcused_absence', 'recovered', 'replacement', 'clear_replacement', 'cancelled'];

/**
 * POST /api/register/mark — one atomic call for a register button press.
 * Finds (or creates) the lesson, applies the mark and returns the finished
 * lesson, so the browser needs a single round trip and a lesson can never be
 * created twice for the same student/day/instrument.
 *
 * Body: { action, lesson_id? } or { action, student_id, date, discipline?, extra? }
 *       + replacement_teacher_id? (for 'replacement')
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'administrator', 'teacher']);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const action = body.action as MarkAction;
    if (!ACTIONS.includes(action)) return NextResponse.json({ error: 'Acțiune necunoscută' }, { status: 400 });
    if (action === 'replacement' && !body.replacement_teacher_id) {
      return NextResponse.json({ error: 'Alege profesorul care a făcut înlocuirea' }, { status: 400 });
    }

    // 1) find or create the lesson
    let lessonId: number;
    let created = false;
    if (body.lesson_id) {
      lessonId = Number(body.lesson_id);
    } else {
      const studentId = Number(body.student_id);
      const date = String(body.date ?? '');
      if (!studentId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Elev sau dată invalidă' }, { status: 400 });

      const [{ data: student }, { data: existing }] = await Promise.all([
        supabase.from('students').select('id, instruments, subscriptions, teacher_id').eq('id', studentId).single(),
        supabase.from('lessons').select('id, discipline, time, teacher_id').eq('student_id', studentId).eq('date', date).order('id'),
      ]);
      if (!student) return NextResponse.json({ error: 'Elevul nu există' }, { status: 404 });
      const lessons = (existing ?? []) as { id: number; discipline: string | null; time: string; teacher_id: number }[];

      const subs = ((student.subscriptions ?? []) as StudentSubscription[]).filter(x => (x.status ?? 'active') === 'active');
      const instruments: string[] = subs.length > 0 ? subs.map(x => x.instrument) : (student.instruments ?? []);
      let discipline: string | null = body.discipline ?? instruments[0] ?? null;
      if (body.extra && !body.discipline) {
        const used = new Set(lessons.map(l => l.discipline));
        discipline = instruments.find(i => !used.has(i)) ?? discipline;
      }

      const same = lessons.find(l => (l.discipline ?? null) === discipline);
      if (same && !body.extra) {
        lessonId = same.id;
      } else {
        const teacherId = subs.length > 0
          ? subs.find(x => x.instrument === discipline)?.teacher_id ?? null
          : student.teacher_id ?? null;
        if (!teacherId) return NextResponse.json({ error: 'Elevul nu are un profesor atribuit — atribuie-l mai întâi din Elevi' }, { status: 400 });
        const guard = restrictToOwnTeacher(ctx!, teacherId);
        if (guard) return guard;

        const usedTimes = new Set(lessons.filter(l => (l.discipline ?? null) === discipline).map(l => (l.time ?? '').slice(0, 5)));
        const time = DEFAULT_TIME_SLOTS.find(t => !usedTimes.has(t)) ?? DEFAULT_TIME_SLOTS[0];
        const { data: inserted, error: insErr } = await supabase.from('lessons')
          .insert({ student_id: studentId, teacher_id: teacherId, date, time, duration: 45, status: 'scheduled', discipline })
          .select('id').single();
        if (insErr || !inserted) return NextResponse.json({ error: insErr?.message ?? 'Nu s-a putut crea lecția' }, { status: 400 });
        lessonId = inserted.id;
        created = true;

        // Race guard (two requests at once / two devices): identical lessons collapse into the oldest.
        const { data: twins } = await supabase.from('lessons').select('id').eq('student_id', studentId).eq('date', date)
          .eq('time', time).eq('discipline', discipline as string).order('id');
        if (twins && twins.length > 1) {
          lessonId = twins[0].id;
          created = twins[0].id === inserted.id;
          await supabase.from('lessons').delete().in('id', twins.slice(1).map(t => t.id));
        }
      }
    }

    // 2) current state
    const { data: lesson } = await supabase.from('lessons').select('id, teacher_id, status, replacement_teacher_id').eq('id', lessonId).single();
    if (!lesson) return NextResponse.json({ error: 'Lecția nu există' }, { status: 404 });
    const guard = restrictToOwnTeacher(ctx!, lesson.teacher_id);
    if (guard) return guard;
    const { data: attRow } = await supabase.from('attendance').select('status, notes').eq('lesson_id', lessonId).maybeSingle();

    const next = nextState(
      { status: lesson.status, attendance_status: attRow?.status ?? null, replacement_teacher_id: lesson.replacement_teacher_id ?? null },
      action, body.replacement_teacher_id ? Number(body.replacement_teacher_id) : null,
    );

    // 3) save
    const lessonUpdate: Record<string, unknown> = { status: next.status, replacement_teacher_id: next.replacement_teacher_id };
    let { error: updErr } = await supabase.from('lessons').update(lessonUpdate).eq('id', lessonId);
    if (updErr && updErr.message.includes('replacement_teacher_id')) {
      delete lessonUpdate.replacement_teacher_id;
      ({ error: updErr } = await supabase.from('lessons').update(lessonUpdate).eq('id', lessonId));
    }
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    if (next.attendance_status) {
      const notes = body.notes !== undefined ? (body.notes || null) : (attRow?.notes ?? null);
      const { error: attErr } = await supabase.from('attendance')
        .upsert({ lesson_id: lessonId, status: next.attendance_status, notes, updated_at: new Date().toISOString() }, { onConflict: 'lesson_id' });
      if (attErr) return NextResponse.json({ error: attErr.message }, { status: 400 });
    }

    return NextResponse.json({ lesson: await fetchShapedLesson(lessonId), created });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
