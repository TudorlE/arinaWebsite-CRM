import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { buildDueDate, updateOverduePayments } from '@/lib/payments';

export async function GET(request: NextRequest) {
  // opportunistic overdue sweep before listing
  await updateOverduePayments();

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const month     = searchParams.get('month');
  const year      = searchParams.get('year');
  const status    = searchParams.get('status');

  let query = supabase
    .from('payments')
    .select('*, students(name, instruments)')
    .order('year',  { ascending: false })
    .order('month', { ascending: false });

  if (studentId) query = query.eq('student_id', studentId);
  if (month)     query = query.eq('month', month);
  if (year)      query = query.eq('year', year);
  if (status)    query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payments = (data ?? []).map(({ students, ...p }: {
    students: { name: string; instruments: string[] } | null;
    [key: string]: unknown;
  }) => ({
    ...p,
    student_name: students?.name ?? null,
    instruments:  students?.instruments ?? [],
  }));

  return NextResponse.json({ payments });
}

export async function POST(request: NextRequest) {
  try {
    const { student_id, amount, month, year, status, payment_date, due_date, notes } = await request.json();
    if (!student_id || !amount || !month || !year || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const isPaid = status === 'paid';
    const today  = new Date().toISOString().split('T')[0];

    const baseInsert = {
      student_id:   Number(student_id),
      amount:       Number(amount),
      month:        Number(month),
      year:         Number(year),
      status,
      payment_date: isPaid ? (payment_date || today) : (payment_date || null),
      notes:        notes || null,
    };

    // Try with new columns first; fall back silently if schema not migrated yet
    const fullInsert = {
      ...baseInsert,
      due_date: due_date || buildDueDate(Number(month), Number(year)),
      paid_at:  isPaid ? new Date().toISOString() : null,
    };

    let { data, error } = await supabase.from('payments').insert(fullInsert).select().single();

    if (error && error.message.includes('due_date')) {
      // Schema not migrated yet — retry without new columns
      ({ data, error } = await supabase.from('payments').insert(baseInsert).select().single());
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ payment: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
