/**
 * Payments automation module — reusable helpers for the music school CRM.
 * Uses Supabase (the app's shared data layer for business data).
 */
import { supabase } from './supabase';
import { StudentSubscription } from './types';

/* ─────────────────────────────────────────────────────────────
 *  Types
 * ────────────────────────────────────────────────────────────*/

export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'overdue';

interface StudentRow {
  id: number;
  status?: string | null;
  subscriptions: StudentSubscription[] | null;
}

/* ─────────────────────────────────────────────────────────────
 *  Helpers
 * ────────────────────────────────────────────────────────────*/

/** Default due day every month (10th). Change here to globally shift. */
const DUE_DAY = 10;

/** Build a YYYY-MM-DD due date string for a given month/year. */
export function buildDueDate(month: number, year: number, day = DUE_DAY): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Returns the {month, year} for the current month. */
export function currentPeriod(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/* ─────────────────────────────────────────────────────────────
 *  1. createMonthlyPayments
 *     Generates an "unpaid" record for every (active student × active
 *     instrument/abonament) pair that lacks a payment in the given month —
 *     matching the per-instrument payment model, not a single flat fee.
 *     Idempotent: re-running never duplicates a (student, service) that
 *     already has a payment that period, so it's safe to use to backfill
 *     students whose payment row was deleted while they're still active.
 * ────────────────────────────────────────────────────────────*/
export async function createMonthlyPayments(
  month?: number,
  year?: number,
): Promise<{ created: number; skipped: number; error?: string }> {
  const period = (month && year) ? { month, year } : currentPeriod();

  const { data: students, error: studentsErr } = await supabase.from('students').select('id, status, subscriptions');
  if (studentsErr) return { created: 0, skipped: 0, error: studentsErr.message };

  const { data: existing, error: existingErr } = await supabase
    .from('payments')
    .select('student_id, service')
    .eq('month', period.month)
    .eq('year', period.year);
  if (existingErr) return { created: 0, skipped: 0, error: existingErr.message };

  const existingKey = (studentId: number, service: string | null) => `${studentId}|${service ?? ''}`;
  const existingSet = new Set((existing ?? []).map((p: { student_id: number; service: string | null }) => existingKey(p.student_id, p.service)));

  const toInsert: { student_id: number; amount: number; month: number; year: number; status: string; service: string; plan_type: string; lesson_count: number }[] = [];
  let skipped = 0;
  for (const s of (students ?? []) as StudentRow[]) {
    if ((s.status ?? 'active') !== 'active') continue;
    for (const sub of s.subscriptions ?? []) {
      if ((sub.status ?? 'active') !== 'active') continue;
      if (existingSet.has(existingKey(s.id, sub.instrument))) { skipped++; continue; }
      toInsert.push({
        student_id: s.id,
        amount: Number(sub.monthly_fee) || 0,
        month: period.month,
        year: period.year,
        status: 'unpaid',
        service: sub.instrument,
        plan_type: sub.plan,
        lesson_count: sub.lessons,
      });
    }
  }
  if (toInsert.length === 0) return { created: 0, skipped };

  let { error: insertErr } = await supabase.from('payments').insert(toInsert);
  // plan_type/lesson_count columns may not be migrated yet — strip and retry.
  if (insertErr && /plan_type|lesson_count/.test(insertErr.message)) {
    const safe = toInsert.map(({ plan_type: _pt, lesson_count: _lc, ...rest }) => rest);
    ({ error: insertErr } = await supabase.from('payments').insert(safe));
  }
  if (insertErr) return { created: 0, skipped, error: insertErr.message };

  return { created: toInsert.length, skipped };
}

/* ─────────────────────────────────────────────────────────────
 *  2. createPaymentForStudent
 *     Auto-generates the current month payment for a single
 *     student (used when a new student is added).
 * ────────────────────────────────────────────────────────────*/
export async function createPaymentForStudent(
  studentId: number,
  monthlyFee: number,
): Promise<void> {
  const { month, year } = currentPeriod();
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('student_id', studentId)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle();
  if (existing) return;
  await supabase.from('payments').insert({
    student_id: studentId,
    amount: Number(monthlyFee) || 0,
    month, year,
    status: 'unpaid',
  });
}

/* ─────────────────────────────────────────────────────────────
 *  3. updateOverduePayments
 *     Flips status="unpaid" -> "overdue" if due_date < today.
 * ────────────────────────────────────────────────────────────*/
export async function updateOverduePayments(): Promise<{ updated: number; error?: string }> {
  // Disabled: "overdue" status is no longer used.
  return { updated: 0 };
}

/* ─────────────────────────────────────────────────────────────
 *  4. markPaymentAsPaid
 *     Sets status=paid + paid_at=now() (and payment_date today).
 * ────────────────────────────────────────────────────────────*/
export async function markPaymentAsPaid(paymentId: number): Promise<{ error?: string }> {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('payments')
    .update({ status: 'paid', payment_date: today })
    .eq('id', paymentId);
  return error ? { error: error.message } : {};
}

/* ─────────────────────────────────────────────────────────────
 *  5. calculateRevenue
 *     Aggregated financial metrics. Optional month/year filter.
 * ────────────────────────────────────────────────────────────*/
export interface RevenueSummary {
  total: number;            // all-time paid
  monthRevenue: number;     // paid this period
  outstanding: number;      // unpaid + overdue (sum of amounts)
  outstandingCount: number; // count of unpaid + overdue
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  partialCount: number;
  paidPercentage: number;   // paidStudents / totalStudents (0..100)
}

export async function calculateRevenue(
  month?: number,
  year?: number,
): Promise<RevenueSummary> {
  const period = (month && year) ? { month, year } : currentPeriod();

  // All-time paid total
  const { data: totalRows } = await supabase.from('payments').select('amount').eq('status', 'paid');
  const total = (totalRows ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);

  // Current period rows
  type PRow = { amount: number; status: string; student_id: number };
  const { data: rowsData } = await supabase
    .from('payments')
    .select('amount, status, student_id')
    .eq('month', period.month)
    .eq('year', period.year);
  const rows = (rowsData ?? []) as PRow[];

  const monthRevenue   = rows.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const outstanding    = rows.filter(r => r.status === 'unpaid' || r.status === 'overdue').reduce((s, r) => s + r.amount, 0);
  const paidCount      = rows.filter(r => r.status === 'paid').length;
  const unpaidCount    = rows.filter(r => r.status === 'unpaid').length;
  const overdueCount   = rows.filter(r => r.status === 'overdue').length;
  const partialCount   = rows.filter(r => r.status === 'partial').length;
  const outstandingCount = unpaidCount + overdueCount;

  const totalCount = rows.length;
  const paidPercentage = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  return {
    total, monthRevenue, outstanding, outstandingCount,
    paidCount, unpaidCount, overdueCount, partialCount,
    paidPercentage,
  };
}
