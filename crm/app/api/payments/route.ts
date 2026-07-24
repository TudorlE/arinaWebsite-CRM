import { NextRequest, NextResponse } from 'next/server';
import { getPayments, createPayment } from '@/lib/db';
import { buildDueDate, updateOverduePayments } from '@/lib/payments';

export async function GET(request: NextRequest) {
  // opportunistic overdue sweep before listing
  await updateOverduePayments();

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const month     = searchParams.get('month');
  const year      = searchParams.get('year');
  const status    = searchParams.get('status');

  const payments = getPayments(
    studentId ? Number(studentId) : undefined,
    month ? Number(month) : undefined,
    year ? Number(year) : undefined,
    status ?? undefined,
  );

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

    const payment = createPayment({
      student_id:   Number(student_id),
      amount:       Number(amount),
      month:        Number(month),
      year:         Number(year),
      status,
      due_date:     due_date || buildDueDate(Number(month), Number(year)),
      payment_date: isPaid ? (payment_date || today) : (payment_date || null),
      paid_at:      isPaid ? new Date().toISOString() : null,
      notes:        notes || null,
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
