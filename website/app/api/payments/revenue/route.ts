import { NextRequest, NextResponse } from 'next/server';
import { calculateRevenue, updateOverduePayments } from '@/lib/payments';

/**
 * GET /api/payments/revenue?month=1-12&year=YYYY
 * Returns the financial summary for a given period (defaults to current month).
 * Also opportunistically refreshes overdue statuses.
 */
export async function GET(request: NextRequest) {
  try {
    await updateOverduePayments();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year  = searchParams.get('year');

    const summary = await calculateRevenue(
      month ? Number(month) : undefined,
      year  ? Number(year)  : undefined,
    );
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
