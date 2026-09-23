import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { computeCredits, currentPeriod } from '@/lib/payments';
import type { StudentSubscription } from '@/lib/types';

/**
 * GET /api/payments/credits?month=1-12&year=YYYY
 * Lesson credits owed for that month (from last month's serious-reason
 * absences) — what the Plăți page shows next to each affected row.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = currentPeriod();
  const month = Number(searchParams.get('month') ?? period.month);
  const year = Number(searchParams.get('year') ?? period.year);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: 'Lună sau an invalid' }, { status: 400 });
  }
  const { data: students, error } = await supabase.from('students').select('id, status, subscriptions');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    const credits = await computeCredits({ month, year }, (students ?? []) as { id: number; status?: string | null; subscriptions: StudentSubscription[] | null }[]);
    return NextResponse.json({ credits: Array.from(credits.values()) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Eroare' }, { status: 500 });
  }
}
