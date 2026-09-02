import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole, restrictToOwnTeacher } from '@/lib/roleGuard';

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active');
  const teacherId = searchParams.get('teacher_id');

  let query = supabase
    .from('recurring_schedules')
    .select('*, students(name), teachers(name), cabinets(name)')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (active !== null) query = query.eq('active', active === 'true');
  if (teacherId) query = query.eq('teacher_id', teacherId);
  if (ctx!.role === 'teacher') {
    const guard = restrictToOwnTeacher(ctx!);
    if (guard) return guard;
    query = query.eq('teacher_id', ctx!.teacherId!);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const schedules = (data ?? []).map(({ students, teachers, cabinets, ...s }: {
    students: { name: string } | null;
    teachers: { name: string } | null;
    cabinets: { name: string } | null;
    [key: string]: unknown;
  }) => ({
    ...s,
    student_name: students?.name ?? null,
    teacher_name: teachers?.name ?? null,
    cabinet_name: cabinets?.name ?? null,
  }));

  return NextResponse.json({ schedules });
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin']);
  if (forbidden) return forbidden;

  try {
    const { student_id, teacher_id, discipline, cabinet_id, day_of_week, start_time, end_time, notes } = await request.json();
    if (!student_id || !teacher_id || day_of_week === undefined || day_of_week === null || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('recurring_schedules')
      .insert({
        student_id: Number(student_id),
        teacher_id: Number(teacher_id),
        discipline: discipline ?? null,
        cabinet_id: cabinet_id ? Number(cabinet_id) : null,
        day_of_week: Number(day_of_week),
        start_time,
        end_time,
        notes: notes ?? null,
        active: true,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ schedule: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
