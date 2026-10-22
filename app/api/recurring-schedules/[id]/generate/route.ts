import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole } from '@/lib/roleGuard';

type Params = { params: Promise<{ id: string }> };

function diffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Feature 2: materialize `lessons` rows for every future date matching the rule's day_of_week. */
export async function POST(request: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin']);
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const { months } = await request.json();
    if (![3, 6, 12].includes(Number(months))) {
      return NextResponse.json({ error: 'months trebuie să fie 3, 6 sau 12' }, { status: 400 });
    }

    const { data: rule, error: ruleErr } = await supabase.from('recurring_schedules').select('*').eq('id', id).single();
    if (ruleErr || !rule) return NextResponse.json({ error: 'Recurring schedule not found' }, { status: 404 });
    if (!rule.active) return NextResponse.json({ error: 'Acest orar fix este dezactivat.' }, { status: 400 });

    // A Solfegiu GROUP schedule (no single student_id) fans out into one
    // lesson row per student CURRENTLY in that group — looked up live from
    // their subscription, not fixed at the time the schedule was created.
    let studentIds: number[];
    if (rule.student_id != null) {
      studentIds = [rule.student_id];
    } else if (rule.group_name) {
      type Sub = { instrument: string; group?: string | null; status?: string | null };
      const { data: students, error: stErr } = await supabase.from('students').select('id, status, subscriptions');
      if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 });
      studentIds = ((students ?? []) as { id: number; status: string | null; subscriptions: Sub[] | null }[])
        .filter(s => (s.status ?? 'active') === 'active')
        .filter(s => (s.subscriptions ?? []).some(x =>
          x.instrument === rule.discipline && (x.status ?? 'active') === 'active' && x.group === rule.group_name,
        ))
        .map(s => s.id);
      if (studentIds.length === 0) {
        return NextResponse.json({ success: true, inserted: 0, checked: 0, note: 'Niciun elev activ în această grupă încă.' });
      }
    } else {
      return NextResponse.json({ error: 'Orarul fix nu are nici elev, nici grupă atribuită.' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startFrom = rule.generated_until ? new Date(rule.generated_until + 'T00:00:00') : new Date(today);
    if (rule.generated_until) startFrom.setDate(startFrom.getDate() + 1);
    const from = startFrom > today ? startFrom : today;

    const to = new Date(today);
    to.setMonth(to.getMonth() + Number(months));

    const duration = diffMinutes(rule.start_time, rule.end_time);
    const rows: Record<string, unknown>[] = [];
    for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== rule.day_of_week) continue;
      for (const studentId of studentIds) {
        rows.push({
          student_id: studentId,
          teacher_id: rule.teacher_id,
          date: fmt(d),
          time: rule.start_time,
          duration,
          status: 'scheduled',
          notes: rule.notes,
          cabinet_id: rule.cabinet_id,
          discipline: rule.discipline,
          recurring_schedule_id: rule.id,
          is_customized: false,
        });
      }
    }

    let inserted = 0;
    if (rows.length > 0) {
      const { data, error } = await supabase
        .from('lessons')
        .upsert(rows, { onConflict: 'recurring_schedule_id,date,student_id', ignoreDuplicates: true })
        .select();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      inserted = data?.length ?? 0;
    }

    await supabase.from('recurring_schedules').update({ generated_until: fmt(to) }).eq('id', id);

    return NextResponse.json({ success: true, inserted, checked: rows.length });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
