/**
 * Payments automation module — reusable helpers for the music school CRM.
 * Uses the local SQLite database (better-sqlite3) via lib/db.ts.
 */
import Database from 'better-sqlite3';
import path from 'path';

declare global { var _arryDb: Database.Database | undefined; }
function getDb(): Database.Database {
  if (global._arryDb) return global._arryDb;
  const db = new Database(path.join(process.cwd(), 'arrycrm.db'));
  db.pragma('journal_mode = WAL');
  global._arryDb = db;
  return db;
}

/* ─────────────────────────────────────────────────────────────
 *  Types
 * ────────────────────────────────────────────────────────────*/

export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'overdue';

interface StudentRow {
  id: number;
  monthly_fee: number | string;
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
 *     Generates an "unpaid" record for each student that lacks
 *     a payment in the given month. Idempotent (no duplicates).
 * ────────────────────────────────────────────────────────────*/
export async function createMonthlyPayments(
  month?: number,
  year?: number,
): Promise<{ created: number; skipped: number; error?: string }> {
  const period = (month && year) ? { month, year } : currentPeriod();
  const db = getDb();

  const students = db.prepare('SELECT id, monthly_fee FROM students').all() as StudentRow[];
  const existing = db.prepare('SELECT student_id FROM payments WHERE month = ? AND year = ?')
    .all(period.month, period.year) as { student_id: number }[];
  const existingIds = new Set(existing.map(p => p.student_id));

  const toInsert = students.filter(s => !existingIds.has(s.id));
  if (toInsert.length === 0) return { created: 0, skipped: existingIds.size };

  const stmt = db.prepare(
    'INSERT INTO payments (student_id, amount, month, year, status) VALUES (?,?,?,?,?)'
  );
  const insertMany = db.transaction(() => {
    for (const s of toInsert) {
      stmt.run(s.id, Number(s.monthly_fee) || 0, period.month, period.year, 'unpaid');
    }
  });
  insertMany();
  return { created: toInsert.length, skipped: existingIds.size };
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
  const db = getDb();
  const existing = db.prepare(
    'SELECT id FROM payments WHERE student_id = ? AND month = ? AND year = ?'
  ).get(studentId, month, year);
  if (existing) return;
  db.prepare('INSERT INTO payments (student_id, amount, month, year, status) VALUES (?,?,?,?,?)').run(
    studentId, Number(monthlyFee) || 0, month, year, 'unpaid'
  );
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
  try {
    const today = new Date().toISOString().split('T')[0];
    getDb().prepare("UPDATE payments SET status = 'paid', payment_date = ? WHERE id = ?").run(today, paymentId);
    return {};
  } catch (e) {
    return { error: String(e) };
  }
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
  const db = getDb();

  // All-time paid total
  const totalRow = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM payments WHERE status='paid'").get() as { t: number };
  const total = totalRow.t;

  // Current period rows
  type PRow = { amount: number; status: string; student_id: number };
  const rows = db.prepare(
    'SELECT amount, status, student_id FROM payments WHERE month = ? AND year = ?'
  ).all(period.month, period.year) as PRow[];

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
