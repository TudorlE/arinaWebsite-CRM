import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('payments')
    .select('*, students(name, instruments)')
    .eq('id', id)
    .single();
  if (error || !data) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  const { students, ...payment } = data as {
    students: { name: string; instruments: string[] } | null;
    [key: string]: unknown;
  };
  return NextResponse.json({
    payment: { ...payment, student_name: students?.name ?? null, instruments: students?.instruments ?? [] },
  });
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

    let { data, error } = await supabase.from('payments').update(update).eq('id', id).select().single();

    // If new columns not yet in schema, strip them and retry
    if (error && (error.message.includes('due_date') || error.message.includes('paid_at'))) {
      const safe = { ...update };
      delete safe.due_date;
      delete safe.paid_at;
      ({ data, error } = await supabase.from('payments').update(safe).eq('id', id).select().single());
    }

    if (error || !data) return NextResponse.json({ error: error?.message ?? 'Payment not found' }, { status: 404 });
    return NextResponse.json({ payment: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
