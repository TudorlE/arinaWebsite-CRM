import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data: student, error } = await supabase
    .from('students')
    .select('*, teachers(name), cabinets(name)')
    .eq('id', id)
    .single();
  if (error || !student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const { data: notes } = await supabase
    .from('student_notes')
    .select('*')
    .eq('student_id', id)
    .order('created_at', { ascending: false });

  const { teachers, cabinets, ...rest } = student as { teachers: { name: string } | null; cabinets: { name: string } | null; [key: string]: unknown };
  return NextResponse.json({
    student: { ...rest, teacher_name: teachers?.name ?? null, cabinet_name: cabinets?.name ?? null },
    notes: notes ?? [],
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ['name', 'birth_date', 'phone', 'email', 'instruments', 'level', 'monthly_fee', 'teacher_id', 'cabinet_id', 'notes', 'status'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    const { data: student, error } = await supabase.from('students').update(update).eq('id', id).select().single();
    if (error || !student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json({ student });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    if (body.action === 'add_note') {
      const { data: note, error } = await supabase
        .from('student_notes')
        .insert({ student_id: Number(id), content: body.content })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ note }, { status: 201 });
    }
    if (body.action === 'delete_note') {
      const { error } = await supabase.from('student_notes').delete().eq('id', Number(body.note_id));
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
