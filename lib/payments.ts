/**
 * Payments automation module — reusable helpers for the music school CRM.
 * Uses Supabase (the app's shared data layer for business data).
 */
import { supabase } from './supabase';
import { StudentSubscription, MONTHS } from './types';
import { todayChisinau, currentPeriodChisinau, monthEnd } from './dates';
import { perLessonPrice } from './pricing';
import { countAbsences, creditLessons, creditMoney, initialRow, planRowUpdate, type CreditLesson } from './credits';

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
  return currentPeriodChisinau();
}

/* ─────────────────────────────────────────────────────────────
 *  Lesson credit — a lesson missed for a serious reason ("M" in the register)
 *  in month X takes the price of that lesson off the same instrument's
 *  subscription in month X+1 (see lib/credits.ts for the rules).
 * ────────────────────────────────────────────────────────────*/
export interface CreditInfo {
  student_id: number;
  service: string;
  credit_lessons: number;
  per_lesson: number;
  credit_amount: number;
  excused: number;
  recovered: number;
  from_month: number;
  from_year: number;
  from_label: string;
}

export function previousPeriod(period: { month: number; year: number }): { month: number; year: number } {
  return period.month === 1 ? { month: 12, year: period.year - 1 } : { month: period.month - 1, year: period.year };
}

/** Credits owed to each active student/instrument for `period`, keyed `${studentId}|${instrument}`. */
export async function computeCredits(
  period: { month: number; year: number },
  students: StudentRow[],
): Promise<Map<string, CreditInfo>> {
  const out = new Map<string, CreditInfo>();
  const ids = students.map(s => s.id);
  if (ids.length === 0) return out;
  const prev = previousPeriod(period);
  const { data, error } = await supabase
    .from('lessons')
    .select('student_id, discipline, date, time, status, replacement_teacher_id, attendance(status)')
    .gte('date', `${prev.year}-${String(prev.month).padStart(2, '0')}-01`)
    .lte('date', monthEnd(prev.year, prev.month))
    .in('student_id', ids);
  if (error) throw new Error(error.message);

  type Row = { student_id: number; discipline: string | null; date: string; time: string; status: string; replacement_teacher_id: number | null; attendance: { status: string } | { status: string }[] | null };
  const lessons: CreditLesson[] = ((data ?? []) as Row[]).map(l => {
    const att = Array.isArray(l.attendance) ? l.attendance[0] : l.attendance;
    return {
      student_id: l.student_id, discipline: l.discipline, date: l.date, time: l.time, status: l.status,
      attendance_status: att?.status ?? null, replacement_teacher_id: l.replacement_teacher_id ?? null,
    };
  });

  const byId = new Map(students.map(s => [s.id, s]));
  const activeInstruments = (id: number) => (byId.get(id)?.subscriptions ?? []).filter(x => (x.status ?? 'active') === 'active').map(x => x.instrument);
  const absences = countAbsences(lessons, activeInstruments);
  const fromLabel = MONTHS[prev.month - 1].toLowerCase();

  for (const s of students) {
    if ((s.status ?? 'active') !== 'active') continue;
    for (const sub of s.subscriptions ?? []) {
      if ((sub.status ?? 'active') !== 'active') continue;
      const abs = absences.get(`${s.id}|${sub.instrument}`);
      const lessonsCredit = creditLessons(abs, sub.lessons);
      const perLesson = perLessonPrice(sub.instrument, sub.plan);
      const money = creditMoney(lessonsCredit, perLesson);
      if (money <= 0 || !perLesson || !abs) continue;
      out.set(`${s.id}|${sub.instrument}`, {
        student_id: s.id, service: sub.instrument, credit_lessons: lessonsCredit, per_lesson: perLesson, credit_amount: money,
        excused: abs.excused, recovered: abs.recovered, from_month: prev.month, from_year: prev.year, from_label: fromLabel,
      });
    }
  }
  return out;
}

/* ─────────────────────────────────────────────────────────────
 *  1. createMonthlyPayments
 *     Brings a month's payments into the canonical shape, idempotently:
 *       • one "unpaid" row per (active student × active instrument) that
 *         lacks one — so a new month only needs statuses flipped to paid;
 *       • duplicate rows for the same student+instrument collapse into one
 *         (the most-paid one is kept, so no paid record is ever lost);
 *       • old single-amount rows with no instrument are folded into the
 *         per-instrument rows (converted when the student has one
 *         instrument, dropped when unpaid and the student has several);
 *       • unpaid rows of paused/inactive students, or for an instrument the
 *         student no longer has, are removed.
 *     Safe to run any number of times.
 * ────────────────────────────────────────────────────────────*/
const STATUS_RANK: Record<string, number> = { paid: 3, partial: 2, unpaid: 1, overdue: 1 };

export async function createMonthlyPayments(
  month?: number,
  year?: number,
  opts: { studentId?: number } = {},
): Promise<{ created: number; skipped: number; removed: number; fixed: number; adjusted: number; error?: string }> {
  const period = (month && year) ? { month, year } : currentPeriod();
  const fail = (error: string) => ({ created: 0, skipped: 0, removed: 0, fixed: 0, adjusted: 0, error });

  let studentsQuery = supabase.from('students').select('id, status, subscriptions');
  if (opts.studentId) studentsQuery = studentsQuery.eq('id', opts.studentId);
  const { data: students, error: studentsErr } = await studentsQuery;
  if (studentsErr) return fail(studentsErr.message);

  type PRow = { id: number; student_id: number; service: string | null; status: string; amount: number; notes: string | null };
  let rowsQuery = supabase
    .from('payments')
    .select('id, student_id, service, status, amount, notes')
    .eq('month', period.month)
    .eq('year', period.year);
  if (opts.studentId) rowsQuery = rowsQuery.eq('student_id', opts.studentId);
  const { data: rowsData, error: rowsErr } = await rowsQuery;
  if (rowsErr) return fail(rowsErr.message);
  let rows = (rowsData ?? []) as PRow[];

  const studentById = new Map((students ?? []).map((s: StudentRow) => [s.id, s]));
  const isActive = (s?: StudentRow) => (s?.status ?? 'active') === 'active';
  const activeSubs = (s?: StudentRow) => (s?.subscriptions ?? []).filter(sub => (sub.status ?? 'active') === 'active');

  const toDelete = new Set<number>();
  let fixed = 0;

  // 1) collapse duplicates of the same (student, instrument)
  const groups = new Map<string, PRow[]>();
  for (const r of rows) {
    const k = `${r.student_id}|${r.service ?? ''}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const keep = g.reduce((a, b) => {
      const ra = STATUS_RANK[a.status] ?? 1, rb = STATUS_RANK[b.status] ?? 1;
      return rb > ra || (rb === ra && b.id > a.id) ? b : a;
    });
    for (const r of g) if (r.id !== keep.id) toDelete.add(r.id);
  }
  rows = rows.filter(r => !toDelete.has(r.id));

  // 2) old rows with no instrument
  const covered = new Set<number>(); // students whose paid/partial legacy row still stands in for their instruments
  for (const r of rows.filter(x => !x.service)) {
    const subs = activeSubs(studentById.get(r.student_id));
    const alreadyPerInstrument = rows.some(x => x.student_id === r.student_id && x.service);
    if (subs.length === 1 && !alreadyPerInstrument) {
      const sub = subs[0];
      const { error } = await supabase.from('payments').update({ service: sub.instrument, plan_type: sub.plan, lesson_count: sub.lessons }).eq('id', r.id);
      if (!error) { r.service = sub.instrument; fixed++; continue; }
    }
    if ((STATUS_RANK[r.status] ?? 1) === 1) toDelete.add(r.id);
    else covered.add(r.student_id);
  }
  rows = rows.filter(r => !toDelete.has(r.id));

  // 3) unpaid rows of paused/inactive students
  for (const r of rows) {
    if (!isActive(studentById.get(r.student_id)) && (STATUS_RANK[r.status] ?? 1) === 1) toDelete.add(r.id);
  }
  rows = rows.filter(r => !toDelete.has(r.id));

  // 3b) unpaid rows for an instrument the (active) student no longer has
  for (const r of rows) {
    const st = studentById.get(r.student_id);
    const subs = activeSubs(st);
    if (r.service && isActive(st) && subs.length > 0 && (STATUS_RANK[r.status] ?? 1) === 1
        && !subs.some(sub => sub.instrument === r.service)) toDelete.add(r.id);
  }
  rows = rows.filter(r => !toDelete.has(r.id));

  if (toDelete.size > 0) {
    const { error } = await supabase.from('payments').delete().in('id', Array.from(toDelete));
    if (error) return fail(error.message);
  }

  // Lesson credit from last month's serious-reason absences. If it can't be
  // computed, rows are simply left as they are (never guessed).
  let credits: Map<string, CreditInfo> | null = null;
  try { credits = await computeCredits(period, (students ?? []) as StudentRow[]); } catch { credits = null; }
  const prevLabel = MONTHS[previousPeriod(period).month - 1].toLowerCase();

  // 3c) bring untouched unpaid rows in line with the current credit
  let adjusted = 0;
  if (credits) {
    for (const r of rows) {
      if (!r.service) continue;
      const sub = activeSubs(studentById.get(r.student_id)).find(x => x.instrument === r.service);
      if (!sub) continue;
      const credit = credits.get(`${r.student_id}|${r.service}`)?.credit_lessons ?? 0;
      const change = planRowUpdate(
        { amount: r.amount, status: r.status, notes: r.notes }, Number(sub.monthly_fee) || 0,
        perLessonPrice(sub.instrument, sub.plan), credit, prevLabel,
      );
      if (!change) continue;
      const { error } = await supabase.from('payments').update({ amount: change.amount, notes: change.notes }).eq('id', r.id);
      if (!error) adjusted++;
    }
  }

  // 4) create whatever is still missing
  const have = new Set(rows.map(r => `${r.student_id}|${r.service ?? ''}`));
  const toInsert: { student_id: number; amount: number; month: number; year: number; status: string; service: string; plan_type: string; lesson_count: number; notes?: string }[] = [];
  let skipped = 0;
  for (const s of (students ?? []) as StudentRow[]) {
    if (!isActive(s) || covered.has(s.id)) continue;
    for (const sub of activeSubs(s)) {
      if (have.has(`${s.id}|${sub.instrument}`)) { skipped++; continue; }
      have.add(`${s.id}|${sub.instrument}`);
      const credit = credits?.get(`${s.id}|${sub.instrument}`)?.credit_lessons ?? 0;
      const first = initialRow(Number(sub.monthly_fee) || 0, perLessonPrice(sub.instrument, sub.plan), credit, prevLabel);
      toInsert.push({
        student_id: s.id,
        amount: first.amount,
        month: period.month,
        year: period.year,
        status: 'unpaid',
        service: sub.instrument,
        plan_type: sub.plan,
        lesson_count: sub.lessons,
        ...(first.notes ? { notes: first.notes } : {}),
      });
    }
  }
  if (toInsert.length > 0) {
    let { error: insertErr } = await supabase.from('payments').insert(toInsert);
    // plan_type/lesson_count columns may not be migrated yet — strip and retry.
    if (insertErr && /plan_type|lesson_count/.test(insertErr.message)) {
      const safe = toInsert.map(({ plan_type: _pt, lesson_count: _lc, ...rest }) => rest);
      ({ error: insertErr } = await supabase.from('payments').insert(safe));
    }
    if (insertErr) return fail(insertErr.message);
  }

  return { created: toInsert.length, skipped, removed: toDelete.size, fixed, adjusted };
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
  const today = todayChisinau();
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
