import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  const [cabinetsRes, assignmentsRes, dayStatusRes, overridesRes] = await Promise.all([
    supabase.from('cabinets').select('*').order('name'),
    supabase.from('cabinet_teacher_assignments').select('*, teachers(name)'),
    supabase.from('cabinet_day_status').select('*'),
    date
      ? supabase.from('cabinet_teacher_overrides').select('*, teachers(name)').eq('date', date)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (cabinetsRes.error) return NextResponse.json({ error: cabinetsRes.error.message }, { status: 500 });

  const assignments = (assignmentsRes.data ?? []).map(({ teachers, ...a }: { teachers: { name: string } | null; [key: string]: unknown }) => ({
    ...a,
    teacher_name: (teachers as { name: string } | null)?.name ?? null,
  }));
  // Overrides table may not be migrated yet — ignore the error, just show none.
  const overrides = (overridesRes.error ? [] : overridesRes.data ?? []).map(({ teachers, ...o }: { teachers: { name: string } | null; [key: string]: unknown }) => ({
    ...o,
    teacher_name: (teachers as { name: string } | null)?.name ?? null,
  }));

  return NextResponse.json({ cabinets: cabinetsRes.data, assignments, dayStatuses: dayStatusRes.data ?? [], overrides });
}

export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json();
    if (!name) return NextResponse.json({ error: 'Numele cabinetului este obligatoriu' }, { status: 400 });

    const { data, error } = await supabase
      .from('cabinets')
      .insert({ name, color: color ?? '#6366f1' })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ cabinet: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
