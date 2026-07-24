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

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ['student_id', 'teacher_id', 'date', 'time', 'duration', 'status', 'notes', 'cabinet_id'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase.from('lessons').update(update).eq('id', id).select().single();
    if (error || !data) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    return NextResponse.json({ lesson: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
