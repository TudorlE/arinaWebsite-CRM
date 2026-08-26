import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole, restrictToOwnTeacher } from '@/lib/roleGuard';

type EmbeddedLesson = {
  id: number; date: string; time: string; discipline: string | null;
  student_id: number; teacher_id: number;
  students: { name: string } | null;
  teachers: { name: string } | null;
  attendance: { id: number; status: string; notes: string | null } | { id: number; status: string; notes: string | null }[] | null;
  [key: string]: unknown;
};

/** Shared filter-building for the register list (GET) and the CSV export. */
export function buildAttendanceQuery(request: NextRequest, statusFilter: string | null) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const teacherId = searchParams.get('teacher_id');
  const discipline = searchParams.get('discipline');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  const embed = statusFilter ? 'attendance!inner(id,status,notes)' : 'attendance(id,status,notes)';
  let query = supabase
    .from('lessons')
    .select(`id, date, time, discipline, student_id, teacher_id, students(name), teachers(name), ${embed}`, { count: 'exact' })
    .lte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: false })
    .order('time', { ascending: false });

  if (studentId) query = query.eq('student_id', studentId);
  if (teacherId) query = query.eq('teacher_id', teacherId);
  if (discipline) query = query.eq('discipline', discipline);
  if (dateFrom) query = query.gte('date', dateFrom);
  if (dateTo) query = query.lte('date', dateTo);
  if (statusFilter) query = query.eq('attendance.status', statusFilter);

  return query;
}

function toRows(data: EmbeddedLesson[] | null) {
  return (data ?? []).map(l => {
    const att = Array.isArray(l.attendance) ? l.attendance[0] : l.attendance;
    return {
      lesson_id: l.id,
      date: l.date,
      time: l.time,
      discipline: l.discipline,
      student_id: l.student_id,
      student_name: l.students?.name ?? null,
      teacher_id: l.teacher_id,
      teacher_name: l.teachers?.name ?? null,
      status: att?.status ?? null,
      notes: att?.notes ?? null,
      attendance_id: att?.id ?? null,
    };
  });
}

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);
  const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);

  let query = buildAttendanceQuery(request, status);

  if (ctx!.role === 'teacher') {
    const guard = restrictToOwnTeacher(ctx!);
    if (guard) return guard;
    query = query.eq('teacher_id', ctx!.teacherId!);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ records: toRows(data as unknown as EmbeddedLesson[]), total: count ?? 0 });
}

/** Upserts a single attendance record for one lesson occurrence (Feature 6 + 7 marking). */
export async function PUT(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  try {
    const { lesson_id, status, notes } = await request.json();
    if (!lesson_id || !status) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    if (ctx!.role === 'teacher') {
      const { data: lesson } = await supabase.from('lessons').select('teacher_id').eq('id', lesson_id).single();
      const guard = restrictToOwnTeacher(ctx!, lesson?.teacher_id);
      if (guard) return guard;
    }

    const { data, error } = await supabase
      .from('attendance')
      .upsert(
        { lesson_id: Number(lesson_id), status, notes: notes ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'lesson_id' },
      )
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ attendance: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
