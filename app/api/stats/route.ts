import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { todayChisinau, currentPeriodChisinau, monthEnd as lastDayOfMonth } from '@/lib/dates';

/**
 * GET /api/stats?month=1-12&year=YYYY
 * Month/year scope the payment- and lesson-count stats; defaults to the
 * current month. "Lecții azi" always reflects the real current date.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam  = searchParams.get('year');

    const today = todayChisinau();
    const period = currentPeriodChisinau();
    const cm    = monthParam ? Number(monthParam) : period.month;
    const cy    = yearParam  ? Number(yearParam)  : period.year;
    const monthStart = `${cy}-${String(cm).padStart(2, '0')}-01`;
    const monthEnd   = lastDayOfMonth(cy, cm);

    const [
      { count: totalTeachers },
      { data: students },
      { count: upcomingLessonsToday },
      { count: pendingPayments },
      { count: completedLessonsThisMonth },
      { data: paidPayments },
      { count: unpaidCount },
    ] = await Promise.all([
      supabase.from('teachers').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('status, monthly_fee, subscriptions'),
      supabase.from('lessons').select('*', { count: 'exact', head: true })
        .eq('date', today).eq('status', 'scheduled'),
      supabase.from('payments').select('*', { count: 'exact', head: true })
        .eq('month', cm).eq('year', cy).neq('status', 'paid'),
      supabase.from('lessons').select('*', { count: 'exact', head: true })
        .gte('date', monthStart).lte('date', monthEnd).eq('status', 'completed'),
      supabase.from('payments').select('amount')
        .eq('month', cm).eq('year', cy).eq('status', 'paid'),
      supabase.from('payments').select('*', { count: 'exact', head: true })
        .eq('month', cm).eq('year', cy).eq('status', 'unpaid'),
    ]);

    // Only active students count; income is the sum of their active per-instrument fees.
    type SRow = { status: string | null; monthly_fee: number; subscriptions: { status?: string; monthly_fee: number }[] | null };
    const activeStudents = ((students ?? []) as SRow[]).filter(r => (r.status ?? 'active') === 'active');
    const totalMonthlyIncome = activeStudents.reduce((sum, r) => {
      const subs = (r.subscriptions ?? []).filter(x => (x.status ?? 'active') === 'active');
      return sum + (subs.length > 0 ? subs.reduce((a, x) => a + Number(x.monthly_fee || 0), 0) : Number(r.monthly_fee || 0));
    }, 0);
    const paidThisMonth = (paidPayments ?? []).reduce(
      (s: number, r: { amount: number }) => s + Number(r.amount), 0
    );

    return NextResponse.json({
      stats: {
        totalStudents:             activeStudents.length,
        totalMonthlyIncome,
        upcomingLessonsToday:      upcomingLessonsToday      ?? 0,
        pendingPayments:           pendingPayments           ?? 0,
        totalTeachers:             totalTeachers             ?? 0,
        completedLessonsThisMonth: completedLessonsThisMonth ?? 0,
        paidThisMonth,
        unpaidCount:               unpaidCount               ?? 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
