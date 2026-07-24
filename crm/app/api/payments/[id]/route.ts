import { NextRequest, NextResponse } from 'next/server';
import { getPaymentById, updatePayment, deletePayment } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const payment = getPaymentById(Number(id));
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  return NextResponse.json({ payment });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ['student_id', 'amount', 'month', 'year', 'status', 'due_date', 'payment_date', 'paid_at', 'notes'];
    const update: Record<string, unknown> = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    );
    // Automation: paid status → set paid_at + payment_date if missing
    if (update.status === 'paid') {
      if (!update.paid_at)      update.paid_at      = new Date().toISOString();
      if (!update.payment_date) update.payment_date = new Date().toISOString().split('T')[0];
    }
    // Reverting away from paid → clear paid_at
    if (update.status && update.status !== 'paid' && body.status !== undefined) {
      update.paid_at = null;
    }

    const payment = updatePayment(Number(id), update);
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    return NextResponse.json({ payment });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  deletePayment(Number(id));
  return NextResponse.json({ success: true });
}
