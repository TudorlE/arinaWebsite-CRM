import { NextRequest, NextResponse } from 'next/server';
import { createMonthlyPayments, updateOverduePayments } from '@/lib/payments';

/**
 * POST /api/payments/generate
 * Body (optional): { month: 1-12, year: YYYY }
 * Generates "unpaid" payments for every student that lacks one for the period,
 * then flips any past-due unpaid records to "overdue".
 */
export async function POST(request: NextRequest) {
  try {
    let month: number | undefined;
    let year:  number | undefined;
    try {
      const body = await request.json();
      if (body?.month) month = Number(body.month);
      if (body?.year)  year  = Number(body.year);
    } catch {
      // empty body is fine — defaults to current month
    }

    if (month !== undefined || year !== undefined) {
      const valid = Number.isInteger(month) && Number.isInteger(year) && month! >= 1 && month! <= 12 && year! >= 2020 && year! <= 2100;
      if (!valid) return NextResponse.json({ error: 'Lună sau an invalid' }, { status: 400 });
    }

    const generated = await createMonthlyPayments(month, year);
    if (generated.error) {
      return NextResponse.json({ error: generated.error }, { status: 500 });
    }

    const overdue = await updateOverduePayments();

    return NextResponse.json({
      created:        generated.created,
      skipped:        generated.skipped,
      removed:        generated.removed,
      fixed:          generated.fixed,
      overdueUpdated: overdue.updated,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
