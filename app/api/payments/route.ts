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
    const {
      student_id, amount, month, year, status, payment_date, due_date, notes,
      service, plan_type, lesson_count, price_per_lesson,
    } = await request.json();
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
    const extended = {
      service: service || null,
      plan_type: plan_type || null,
      lesson_count: lesson_count ? Number(lesson_count) : null,
      price_per_lesson: price_per_lesson ? Number(price_per_lesson) : null,
    };
    const fullInsert = {
      ...baseInsert,
      ...extended,
      due_date: due_date || buildDueDate(Number(month), Number(year)),
      paid_at:  isPaid ? new Date().toISOString() : null,
    };

    // A student has at most one payment per (month, year, service) — registering
    // another one for the same period updates it instead of creating a duplicate.
    let existingQuery = supabase.from('payments').select('id')
      .eq('student_id', baseInsert.student_id).eq('month', baseInsert.month).eq('year', baseInsert.year);
    existingQuery = extended.service ? existingQuery.eq('service', extended.service) : existingQuery.is('service', null);
    const { data: existing } = await existingQuery.maybeSingle();

    let data, error;
    if (existing) {
      ({ data, error } = await supabase.from('payments').update(fullInsert).eq('id', existing.id).select().single());
    } else {
      ({ data, error } = await supabase.from('payments').insert(fullInsert).select().single());
    }

    // Schema not migrated yet for one of the newer columns — retry without them.
    if (error && /due_date|paid_at|service|plan_type|lesson_count|price_per_lesson/.test(error.message)) {
      if (existing) {
        ({ data, error } = await supabase.from('payments').update(baseInsert).eq('id', existing.id).select().single());
      } else {
        ({ data, error } = await supabase.from('payments').insert(baseInsert).select().single());
      }
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ payment: data }, { status: existing ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
