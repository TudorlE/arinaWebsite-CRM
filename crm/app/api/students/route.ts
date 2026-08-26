import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createPaymentForStudent } from '@/lib/payments';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search     = searchParams.get('search');
  const instrument = searchParams.get('instrument');
  const level      = searchParams.get('level');

  let query = supabase
    .from('students')
    .select('*, teachers(name), cabinets(name)')
    .order('name');

  if (instrument) query = query.contains('instruments', [instrument]);
  if (level)      query = query.eq('level', level);
  if (search)     query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const students = (data ?? []).map(({ teachers, cabinets, ...s }: { teachers: { name: string } | null; cabinets: { name: string } | null; [key: string]: unknown }) => ({
    ...s,
    teacher_name: teachers?.name ?? null,
    cabinet_name: cabinets?.name ?? null,
  }));

  return NextResponse.json({ students });
}

export async function POST(request: NextRequest) {
  try {
    const { name, birth_date, phone, email, instruments, level, monthly_fee, teacher_id, cabinet_id, notes, status } = await request.json();
    if (!name || !birth_date || !phone || !email || !instruments?.length || !level || !monthly_fee) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('students')
      .insert({
        name, birth_date, phone, email, instruments, level,
        monthly_fee: Number(monthly_fee),
        teacher_id: teacher_id ? Number(teacher_id) : null,
        cabinet_id: cabinet_id ? Number(cabinet_id) : null,
        notes: notes ?? null,
        status: status ?? 'active',
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    // Automation: auto-create the current month "unpaid" payment for the new student.
    if (data?.id) {
      try { await createPaymentForStudent(data.id, Number(monthly_fee)); } catch { /* non-fatal */ }
    }
    return NextResponse.json({ student: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
