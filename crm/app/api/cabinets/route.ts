import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const [cabinetsRes, assignmentsRes] = await Promise.all([
    supabase.from('cabinets').select('*').order('name'),
    supabase.from('cabinet_teacher_assignments').select('*, teachers(name)'),
  ]);

  if (cabinetsRes.error) return NextResponse.json({ error: cabinetsRes.error.message }, { status: 500 });

  const assignments = (assignmentsRes.data ?? []).map(({ teachers, ...a }: { teachers: { name: string } | null; [key: string]: unknown }) => ({
    ...a,
    teacher_name: (teachers as { name: string } | null)?.name ?? null,
  }));

  return NextResponse.json({ cabinets: cabinetsRes.data, assignments });
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
