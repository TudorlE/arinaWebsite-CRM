import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole, restrictToOwnTeacher } from '@/lib/roleGuard';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { id } = await params;
  const { data, error } = await supabase
    .from('recurring_schedules')
    .select('*, students(name), teachers(name), cabinets(name)')
    .eq('id', id)
    .single();
  if (error || !data) return NextResponse.json({ error: 'Recurring schedule not found' }, { status: 404 });

  const guard = restrictToOwnTeacher(ctx!, data.teacher_id);
  if (guard) return guard;

  const { students, teachers, cabinets, ...schedule } = data as {
    students: { name: string } | null; teachers: { name: string } | null; cabinets: { name: string } | null;
    [key: string]: unknown;
  };
  return NextResponse.json({
    schedule: { ...schedule, student_name: students?.name ?? null, teacher_name: teachers?.name ?? null, cabinet_name: cabinets?.name ?? null },
  });
}

function diffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin']);
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ['student_id', 'teacher_id', 'discipline', 'cabinet_id', 'day_of_week', 'start_time', 'end_time', 'notes', 'active'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await supabase.from('recurring_schedules').update(update).eq('id', id).select().single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? 'Recurring schedule not found' }, { status: 404 });

    // Cascade content changes to future, non-customized generated lessons.
    // Note: day_of_week changes only affect *future generation* (new lessons),
    // they never move dates of lessons already materialized.
    const lessonUpdate: Record<string, unknown> = {};
    if ('student_id' in update) lessonUpdate.student_id = update.student_id;
    if ('teacher_id' in update) lessonUpdate.teacher_id = update.teacher_id;
    if ('discipline' in update) lessonUpdate.discipline = update.discipline;
    if ('cabinet_id' in update) lessonUpdate.cabinet_id = update.cabinet_id;
    if ('notes' in update) lessonUpdate.notes = update.notes;
    if ('start_time' in update) lessonUpdate.time = update.start_time;
    if ('start_time' in update && 'end_time' in update) {
      lessonUpdate.duration = diffMinutes(update.start_time as string, update.end_time as string);
    } else if ('start_time' in update && data.end_time) {
      lessonUpdate.duration = diffMinutes(update.start_time as string, data.end_time as string);
    }

    if (Object.keys(lessonUpdate).length > 0) {
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('lessons')
        .update(lessonUpdate)
        .eq('recurring_schedule_id', id)
        .eq('is_customized', false)
        .gte('date', today);
    }

    return NextResponse.json({ schedule: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin']);
  if (forbidden) return forbidden;

  const { id } = await params;
  const today = new Date().toISOString().split('T')[0];

  const { data: futureLessons, error: fetchErr } = await supabase
    .from('lessons')
    .select('id')
    .eq('recurring_schedule_id', id)
    .gte('date', today);
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const ids = (futureLessons ?? []).map(l => l.id as number);
  let deletableIds = ids;
  if (ids.length > 0) {
    const { data: attended } = await supabase.from('attendance').select('lesson_id').in('lesson_id', ids);
    const attendedSet = new Set((attended ?? []).map(a => a.lesson_id as number));
    deletableIds = ids.filter(i => !attendedSet.has(i));
    if (deletableIds.length > 0) {
      const { error: delErr } = await supabase.from('lessons').delete().in('id', deletableIds);
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
  }

  const { error } = await supabase.from('recurring_schedules').update({ active: false }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, deleted: deletableIds.length, skipped: ids.length - deletableIds.length });
}
