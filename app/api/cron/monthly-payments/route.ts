import { NextRequest, NextResponse } from 'next/server';
import { createMonthlyPayments } from '@/lib/payments';

/**
 * Runs on the 1st of every month (see vercel.json): creates the new month's
 * "unpaid" payment for every active student/instrument, so the only manual
 * step left is flipping a payment to "paid". Idempotent.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await createMonthlyPayments();
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}
