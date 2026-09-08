import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

/**
 * Excepție punctuală: pentru o singură dată, un cabinet poate avea alt
 * profesor decât cel din șablonul săptămânal (cabinet_teacher_assignments).
 * Folosit din Program Privat pentru cazuri speciale (înlocuiri, schimburi).
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  let query = supabase.from('cabinet_teacher_overrides').select('*, teachers(name)').eq('cabinet_id', id);
  if (date) query = query.eq('date', date);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const overrides = (data ?? []).map(({ teachers, ...o }: { teachers: { name: string } | null; [key: string]: unknown }) => ({
    ...o,
    teacher_name: (teachers as { name: string } | null)?.name ?? null,
  }));
  return NextResponse.json({ overrides });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const { date, teacher_id } = await request.json();
    if (!date) return NextResponse.json({ error: 'Data este obligatorie' }, { status: 400 });

    if (teacher_id === null || teacher_id === '') {
      const { error } = await supabase.from('cabinet_teacher_overrides').delete().eq('cabinet_id', id).eq('date', date);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ override: null });
    }

    const { data, error } = await supabase
      .from('cabinet_teacher_overrides')
      .upsert(
        { cabinet_id: Number(id), date, teacher_id: Number(teacher_id) },
        { onConflict: 'cabinet_id,date' },
      )
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ override: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
