import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('cabinet_teacher_assignments')
    .select('*, teachers(name)')
    .eq('cabinet_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const assignments = (data ?? []).map(({ teachers, ...a }: { teachers: { name: string } | null; [key: string]: unknown }) => ({
    ...a,
    teacher_name: (teachers as { name: string } | null)?.name ?? null,
  }));

  return NextResponse.json({ assignments });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const { day_of_week, teacher_id } = await request.json();

    if (teacher_id === null || teacher_id === '') {
      // Remove assignment if teacher cleared
      const { error } = await supabase
        .from('cabinet_teacher_assignments')
        .delete()
        .eq('cabinet_id', id)
        .eq('day_of_week', day_of_week);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ assignment: null });
    }

    const { data, error } = await supabase
      .from('cabinet_teacher_assignments')
      .upsert(
        { cabinet_id: Number(id), day_of_week: Number(day_of_week), teacher_id: Number(teacher_id) },
        { onConflict: 'cabinet_id,day_of_week' },
      )
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ assignment: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
