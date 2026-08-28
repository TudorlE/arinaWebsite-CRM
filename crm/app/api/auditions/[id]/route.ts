import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole, restrictToOwnTeacher } from '@/lib/roleGuard';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { id } = await params;
  const { data, error } = await supabase.from('auditions').select('*, students(name), teachers(name), cabinets(name, color)').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Audition not found' }, { status: 404 });

  const guard = restrictToOwnTeacher(ctx!, data.teacher_id);
  if (guard) return guard;

  const { students, teachers, cabinets, ...audition } = data as {
    students: { name: string } | null; teachers: { name: string } | null; cabinets: { name: string; color: string } | null; [key: string]: unknown;
  };
  return NextResponse.json({ audition: { ...audition, student_name: students?.name ?? null, teacher_name: teachers?.name ?? null, cabinet_name: cabinets?.name ?? null, cabinet_color: cabinets?.color ?? null } });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    if (ctx!.role === 'teacher') {
      const { data: current } = await supabase.from('auditions').select('teacher_id').eq('id', id).single();
      const guard = restrictToOwnTeacher(ctx!, current?.teacher_id);
      if (guard) return guard;
    }

    const body = await request.json();
    const allowed = ['student_id', 'teacher_id', 'discipline', 'date', 'time', 'duration', 'notes', 'result', 'status', 'cabinet_id'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await supabase.from('auditions').update(update).eq('id', id).select().single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? 'Audition not found' }, { status: 404 });
    return NextResponse.json({ audition: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { id } = await params;
  if (ctx!.role === 'teacher') {
    const { data: current } = await supabase.from('auditions').select('teacher_id').eq('id', id).single();
    const guard = restrictToOwnTeacher(ctx!, current?.teacher_id);
    if (guard) return guard;
  }

  const { error } = await supabase.from('auditions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
