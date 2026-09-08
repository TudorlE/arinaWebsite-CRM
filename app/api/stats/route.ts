import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const today = new Date().toISOString().split('T')[0];
    const cm    = monthParam ? Number(monthParam) : new Date().getMonth() + 1;
    const cy    = yearParam  ? Number(yearParam)  : new Date().getFullYear();
    const monthStart = `${cy}-${String(cm).padStart(2, '0')}-01`;
    const monthEnd   = `${cy}-${String(cm).padStart(2, '0')}-31`;

    const [
      { count: totalStudents },
      { count: totalTeachers },
      { data: students },
      { count: upcomingLessonsToday },
      { count: pendingPayments },
      { count: completedLessonsThisMonth },
      { data: paidPayments },
      { count: unpaidCount },
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('teachers').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('monthly_fee'),
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

    const totalMonthlyIncome = (students ?? []).reduce(
      (s: number, r: { monthly_fee: number }) => s + Number(r.monthly_fee), 0
    );
    const paidThisMonth = (paidPayments ?? []).reduce(
      (s: number, r: { amount: number }) => s + Number(r.amount), 0
    );

    return NextResponse.json({
      stats: {
        totalStudents:             totalStudents             ?? 0,
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
