import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole, restrictToOwnTeacher } from '@/lib/roleGuard';

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const teacherId = searchParams.get('teacher_id');
  const discipline = searchParams.get('discipline');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let query = supabase
    .from('auditions')
    .select('*, students(name), teachers(name)')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (studentId) query = query.eq('student_id', studentId);
  if (discipline) query = query.eq('discipline', discipline);
  if (status) query = query.eq('status', status);

  if (ctx!.role === 'teacher') {
    const guard = restrictToOwnTeacher(ctx!);
    if (guard) return guard;
    query = query.eq('teacher_id', ctx!.teacherId!);
  } else if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let auditions = (data ?? []).map(({ students, teachers, ...a }: {
    students: { name: string } | null; teachers: { name: string } | null; [key: string]: unknown;
  }) => ({ ...a, student_name: students?.name ?? null, teacher_name: teachers?.name ?? null }));

  if (search) {
    const q = search.toLowerCase();
    auditions = auditions.filter((a: { student_name?: string | null }) => (a.student_name ?? '').toLowerCase().includes(q));
  }

  return NextResponse.json({ auditions });
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  try {
    const { student_id, teacher_id, discipline, date, time, duration, notes, result, status } = await request.json();
    if (!student_id || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const guard = restrictToOwnTeacher(ctx!, teacher_id ?? ctx!.teacherId);
    if (ctx!.role === 'teacher' && guard) return guard;

    const { data, error } = await supabase
      .from('auditions')
      .insert({
        student_id: Number(student_id),
        teacher_id: teacher_id ? Number(teacher_id) : (ctx!.role === 'teacher' ? ctx!.teacherId : null),
        discipline: discipline ?? null,
        date, time,
        duration: duration ? Number(duration) : 30,
        notes: notes ?? null,
        result: result ?? null,
        status: status ?? 'scheduled',
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ audition: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
