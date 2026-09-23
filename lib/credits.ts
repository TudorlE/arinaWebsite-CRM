/**
 * Lesson credit: a lesson the student missed for a serious reason (marked "M" in
 * the register) is not charged the following month. It is NOT added as an extra
 * lesson — the price of that many lessons is taken off the next subscription,
 * at the per-lesson price of the student's plan (old/new). Pure functions, no
 * database access, so the money maths can be tested exhaustively.
 */
import { outcomeOf, type MarkLesson, type Outcome } from './attendanceMarks';

export interface CreditLesson extends MarkLesson {
  student_id: number;
  date: string;
  time: string;
}

export interface Absence { excused: number; recovered: number }

/** When the same student/instrument/day/time appears twice, keep the outcome that yields the LEAST credit. */
const RANK: Record<string, number> = { replaced: 6, present: 5, late: 5, recovered: 3, unexcused: 2, excused: 1, cancelled: 0 };

/**
 * Per `${studentId}|${instrument}`: how many lessons were missed with a good
 * reason ("M") and how many make-ups ("R") happened. Lessons whose instrument is
 * unknown are attributed only when the student has exactly one instrument.
 */
export function countAbsences(
  lessons: CreditLesson[],
  instrumentsOf: (studentId: number) => string[],
): Map<string, Absence> {
  const slots = new Map<string, Outcome>();
  for (const l of lessons) {
    let instrument = l.discipline ?? null;
    if (!instrument) {
      const all = instrumentsOf(l.student_id);
      if (all.length !== 1) continue;
      instrument = all[0];
    }
    const outcome = outcomeOf(l);
    if (!outcome) continue;
    const key = `${l.student_id}|${instrument}|${l.date}|${(l.time ?? '').slice(0, 5)}`;
    const cur = slots.get(key);
    if (!cur || (RANK[outcome] ?? -1) > (RANK[cur] ?? -1)) slots.set(key, outcome);
  }
  const out = new Map<string, Absence>();
  for (const [key, outcome] of slots) {
    if (outcome !== 'excused' && outcome !== 'recovered') continue;
    const [studentId, instrument] = key.split('|');
    const k = `${studentId}|${instrument}`;
    const a = out.get(k) ?? { excused: 0, recovered: 0 };
    if (outcome === 'excused') a.excused++; else a.recovered++;
    out.set(k, a);
  }
  return out;
}

/** Lessons to credit: excused absences net of make-ups, never negative, never more than the subscription has. */
export function creditLessons(abs: Absence | undefined, subscriptionLessons: number): number {
  if (!abs) return 0;
  const lessons = Number(subscriptionLessons) || 0;
  return Math.max(0, Math.min(lessons, abs.excused - abs.recovered));
}

/** Money for that many lessons at the plan's per-lesson price. No per-lesson price (e.g. flat group lesson) → no credit. */
export function creditMoney(lessons: number, perLesson: number | null | undefined): number {
  if (!perLesson || perLesson <= 0 || lessons <= 0) return 0;
  return Math.round(lessons * perLesson);
}

export function amountAfterCredit(base: number, money: number): number {
  return Math.max(0, Math.round(base) - money);
}

const CREDIT_LINE = /^Credit (\d+) lec[^\n]*$/m;

export function creditNoteLine(lessons: number, perLesson: number, money: number, fromLabel: string): string {
  return `Credit ${lessons} ${lessons === 1 ? 'lecție' : 'lecții'} × ${perLesson} = −${money} MDL (absențe motivate din ${fromLabel})`;
}

/** Credit lessons recorded in a payment's notes (0 if none). */
export function parseCredit(notes: string | null | undefined): number {
  const m = (notes ?? '').match(CREDIT_LINE);
  return m ? Number(m[1]) : 0;
}

/** Replace (or remove, with null) the credit line in the notes, leaving anything else the admin wrote. */
export function withCreditNote(notes: string | null | undefined, line: string | null): string | null {
  const rest = (notes ?? '').replace(/^Credit \d+ lec[^\n]*(\n|$)/m, '').trim();
  const out = [rest, line].filter(Boolean).join('\n');
  return out || null;
}

/** Amount and notes for a brand-new payment row. */
export function initialRow(base: number, perLesson: number | null, credit: number, fromLabel: string): { amount: number; notes: string | null } {
  const money = creditMoney(credit, perLesson);
  if (money <= 0) return { amount: Math.round(base), notes: null };
  return { amount: amountAfterCredit(base, money), notes: creditNoteLine(credit, perLesson as number, money, fromLabel) };
}

/**
 * What to change on an EXISTING row so it matches the current credit, or null to
 * leave it alone. Only unpaid rows still holding the exact amount the system set
 * are touched — paid/partial rows and amounts edited by hand are never changed.
 */
export function planRowUpdate(
  row: { amount: number; status: string; notes: string | null },
  base: number,
  perLesson: number | null,
  newCredit: number,
  fromLabel: string,
): { amount: number; notes: string | null } | null {
  if (row.status !== 'unpaid') return null;
  const oldCredit = parseCredit(row.notes);
  if (Math.round(Number(row.amount)) !== amountAfterCredit(base, creditMoney(oldCredit, perLesson))) return null;
  const newMoney = creditMoney(newCredit, perLesson);
  const effective = newMoney > 0 ? newCredit : 0;
  const newAmount = amountAfterCredit(base, newMoney);
  if (effective === oldCredit && newAmount === Math.round(Number(row.amount))) return null;
  return {
    amount: newAmount,
    notes: withCreditNote(row.notes, effective > 0 ? creditNoteLine(effective, perLesson as number, newMoney, fromLabel) : null),
  };
}
