import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { LESSON_SELECT, shapeLesson } from '@/lib/lessonShape';
import { getAuthContext, requireRole, restrictToOwnTeacher, restrictToOwnStudent } from '@/lib/roleGuard';

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'administrator', 'teacher', 'student']);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const date      = searchParams.get('date');
  const status    = searchParams.get('status');
  const teacherId = searchParams.get('teacher_id');
  const cabinetId = searchParams.get('cabinet_id');

  const from      = searchParams.get('from');
  const to        = searchParams.get('to');

  let query = supabase
    .from('lessons')
    .select(LESSON_SELECT)
    .order('date', { ascending: false })
    .order('time', { ascending: true });

  if (date)      query = query.eq('date', date);
  if (from)      query = query.gte('date', from);
  if (to)        query = query.lte('date', to);
  if (status)    query = query.eq('status', status);
  if (cabinetId) query = query.eq('cabinet_id', Number(cabinetId));

  if (ctx!.role === 'teacher') {
    const guard = restrictToOwnTeacher(ctx!);
    if (guard) return guard;
    query = query.eq('teacher_id', ctx!.teacherId!);
    if (studentId) query = query.eq('student_id', Number(studentId));
  } else if (ctx!.role === 'student') {
    const guard = restrictToOwnStudent(ctx!);
    if (guard) return guard;
    query = query.eq('student_id', ctx!.studentId!);
  } else {
    // admin / administrator — honor the optional filters as before.
    if (studentId) query = query.eq('student_id', Number(studentId));
    if (teacherId) query = query.eq('teacher_id', Number(teacherId));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ lessons: (data ?? []).map(l => shapeLesson(l as never)) });
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'administrator', 'teacher']);
  if (forbidden) return forbidden;

  try {
    const { student_id, teacher_id, date, time, duration, notes, cabinet_id, discipline } = await request.json();
    if (!student_id || !teacher_id || !date || !time || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (ctx!.role === 'teacher') {
      const guard = restrictToOwnTeacher(ctx!, Number(teacher_id));
      if (guard) return guard;
    }
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        student_id: Number(student_id),
        teacher_id: Number(teacher_id),
        date, time,
        duration: Number(duration),
        notes: notes ?? null,
        status: 'scheduled',
        cabinet_id: cabinet_id ? Number(cabinet_id) : null,
        discipline: discipline ?? null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ lesson: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
