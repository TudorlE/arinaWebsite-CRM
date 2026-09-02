import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole } from '@/lib/roleGuard';

export async function GET() {
  const { data, error } = await supabase
    .from('discipline_teachers')
    .select('discipline, teacher_id, teachers(name)');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = { discipline: string; teacher_id: number | null; teachers: { name: string } | null };
  const assignments = (data as unknown as Row[] ?? []).map(a => ({
    discipline: a.discipline,
    teacher_id: a.teacher_id,
    teacher_name: a.teachers?.name ?? null,
  }));

  return NextResponse.json({ assignments });
}

/** Admin-only: assign (or clear) the teacher for one service/discipline. */
export async function PUT(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin']);
  if (forbidden) return forbidden;

  try {
    const { discipline, teacher_id } = await request.json();
    if (!discipline) return NextResponse.json({ error: 'Missing discipline' }, { status: 400 });

    const { data, error } = await supabase
      .from('discipline_teachers')
      .upsert(
        { discipline, teacher_id: teacher_id ? Number(teacher_id) : null, updated_at: new Date().toISOString() },
        { onConflict: 'discipline' },
      )
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ assignment: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
