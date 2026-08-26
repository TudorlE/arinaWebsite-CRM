import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('lessons')
    .select('*, students(name), teachers(name)')
    .eq('id', id)
    .single();
  if (error || !data) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  const { students, teachers, ...lesson } = data as {
    students: { name: string } | null;
    teachers: { name: string } | null;
    [key: string]: unknown;
  };
  return NextResponse.json({
    lesson: { ...lesson, student_name: students?.name ?? null, teacher_name: teachers?.name ?? null },
  });
}

/** Adds `minutes` to a 'HH:MM' string, wrapping at 24h. */
function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m + minutes + 24 * 60) % (24 * 60);
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const propagate = (body.propagate as 'only' | 'future' | 'all' | undefined) ?? 'only';
    const allowed = ['student_id', 'teacher_id', 'date', 'time', 'duration', 'status', 'notes', 'cabinet_id', 'discipline'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

    const { data: current, error: fetchErr } = await supabase
      .from('lessons')
      .select('id, recurring_schedule_id, date')
      .eq('id', id)
      .single();
    if (fetchErr || !current) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    const isRecurring = current.recurring_schedule_id != null;

    // Plain lesson, or an explicit "only this occurrence" edit on a recurring one.
    if (propagate === 'only' || !isRecurring) {
      const rowUpdate = isRecurring ? { ...update, is_customized: true } : update;
      const { data, error } = await supabase.from('lessons').update(rowUpdate).eq('id', id).select().single();
      if (error || !data) return NextResponse.json({ error: error?.message ?? 'Lesson not found' }, { status: 404 });
      return NextResponse.json({ lesson: data });
    }

    // propagate === 'future' | 'all' on a recurring occurrence.
    const { data, error } = await supabase.from('lessons').update({ ...update, is_customized: false }).eq('id', id).select().single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? 'Lesson not found' }, { status: 404 });

    // Bulk-update sibling occurrences, skipping any that were individually customized.
    let siblingQuery = supabase
      .from('lessons')
      .update(update)
      .eq('recurring_schedule_id', current.recurring_schedule_id)
      .eq('is_customized', false)
      .neq('id', id);
    if (propagate === 'future') siblingQuery = siblingQuery.gte('date', current.date);
    const { error: bulkErr } = await siblingQuery;
    if (bulkErr) return NextResponse.json({ error: bulkErr.message }, { status: 400 });

    // Keep the rule template in sync so future multi-month generation uses the new values.
    const ruleUpdate: Record<string, unknown> = {};
    if ('student_id' in update) ruleUpdate.student_id = update.student_id;
    if ('teacher_id' in update) ruleUpdate.teacher_id = update.teacher_id;
    if ('discipline' in update) ruleUpdate.discipline = update.discipline;
    if ('cabinet_id' in update) ruleUpdate.cabinet_id = update.cabinet_id;
    if ('notes' in update) ruleUpdate.notes = update.notes;
    if ('time' in update) {
      ruleUpdate.start_time = update.time;
      if ('duration' in update && Number(update.duration) > 0) {
        ruleUpdate.end_time = addMinutes(update.time as string, Number(update.duration));
      }
    }
    if (Object.keys(ruleUpdate).length > 0) {
      await supabase.from('recurring_schedules').update(ruleUpdate).eq('id', current.recurring_schedule_id);
    }

    return NextResponse.json({ lesson: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get('mode') as 'occurrence' | 'future' | 'all' | null) ?? 'occurrence';

  const { data: current, error: fetchErr } = await supabase
    .from('lessons')
    .select('id, recurring_schedule_id, date')
    .eq('id', id)
    .single();
  if (fetchErr || !current) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

  const attendedIds = async (lessonIds: number[]): Promise<Set<number>> => {
    if (lessonIds.length === 0) return new Set();
    const { data } = await supabase.from('attendance').select('lesson_id').in('lesson_id', lessonIds);
    return new Set((data ?? []).map(a => a.lesson_id as number));
  };

  if (mode === 'occurrence' || current.recurring_schedule_id == null) {
    const attended = await attendedIds([Number(id)]);
    if (attended.has(Number(id))) {
      return NextResponse.json({ error: 'Lecția are deja o prezență înregistrată și nu poate fi ștearsă.' }, { status: 409 });
    }
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // mode === 'future' | 'all' — resolve the sibling set first.
  let q = supabase.from('lessons').select('id').eq('recurring_schedule_id', current.recurring_schedule_id);
  if (mode === 'future') q = q.gte('date', current.date);
  const { data: candidates, error: candErr } = await q;
  if (candErr) return NextResponse.json({ error: candErr.message }, { status: 500 });

  const ids = (candidates ?? []).map(c => c.id as number);
  const attended = await attendedIds(ids);
  const deletableIds = ids.filter(i => !attended.has(i));
  const skipped = ids.length - deletableIds.length;

  if (deletableIds.length > 0) {
    const { error } = await supabase.from('lessons').delete().in('id', deletableIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (mode === 'all') {
    await supabase.from('recurring_schedules').update({ active: false }).eq('id', current.recurring_schedule_id);
  }

  return NextResponse.json({ success: true, deleted: deletableIds.length, skipped });
}
