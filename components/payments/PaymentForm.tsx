'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Payment, MONTHS, StudentSubscription } from '@/lib/types';
import { isOverageTopUpRow, parseCreditMoney } from '@/lib/credits';
import { ShieldCheck, TrendingDown, TrendingUp, CircleCheck } from 'lucide-react';
import {
  PRICING, SERVICE_KEYS, LESSON_COUNTS, subscriptionAmount, perLessonPrice, planSummary,
  type PlanType, type LessonCount,
} from '@/lib/pricing';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  payment?: Payment | null;
  defaultStudentId?: number;
  /** Month/year the page is currently showing — new payments default to it (e.g. paying a month ahead). */
  defaultMonth?: number;
  defaultYear?: number;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const now = new Date();

function todayMoldova(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Chisinau', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

const blank = {
  student_id: '', service: SERVICE_KEYS[0], plan: 'new' as PlanType, lessons: 4 as LessonCount,
  amount: '', month: String(now.getMonth() + 1), year: String(now.getFullYear()),
  status: 'unpaid', payment_date: todayMoldova(), comment: '',
};

const PAYMENT_LABEL: Record<string, string> = { paid: 'Plătit', unpaid: 'Neplătit', partial: 'Parțial', overdue: 'Restant', paused: 'Pauză' };
const PAYMENT_DOT: Record<string, string> = {
  paid: 'bg-emerald-500', partial: 'bg-orange-500', unpaid: 'bg-red-500', overdue: 'bg-red-500', paused: 'bg-slate-400',
};

/**
 * Situație financiară — the student's full money picture in one glance, right
 * where an admin registers or edits a payment: what she still owes the studio
 * (every unpaid/partial row, any period), and what the studio currently owes
 * HER back (credit for serious-reason absences, already baked into a reduced
 * unpaid row's amount — shown here so it's never missed or double-charged).
 */
function FinancialSnapshot({ history }: { history: Payment[] }) {
  // A payment row for a future month (e.g. next year's abonament, generated
  // ahead of time) isn't a debt yet — only what's due up to and including the
  // current month counts here, otherwise the totals balloon with months that
  // haven't even started.
  const currentYear = now.getFullYear(), currentMonth = now.getMonth() + 1;
  const due = history.filter(p => p.year < currentYear || (p.year === currentYear && p.month <= currentMonth));

  const owed = due.filter(p => p.status === 'unpaid' || p.status === 'partial');
  const totalOwed = owed.reduce((s, p) => s + Number(p.amount), 0);

  // Not restricted to 'unpaid' — a credit can just as well already be baked
  // into a row she already paid (a lower amount than the normal subscription
  // price), and that's still worth surfacing here, not just while it's
  // outstanding.
  const creditRows = due
    .map(p => ({ p, money: parseCreditMoney(p.notes) ?? 0 }))
    .filter(x => x.money > 0);
  const totalCredit = creditRows.reduce((s, x) => s + x.money, 0);

  const isSettled = totalOwed === 0;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Situație financiară</p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
        <div className="p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">
            <TrendingDown className="w-3.5 h-3.5" /> Datorii către studio
          </div>
          <p className={`text-2xl font-extrabold mt-1 ${totalOwed > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {totalOwed.toLocaleString()} <span className="text-xs font-semibold text-slate-400">MDL</span>
          </p>
          {isSettled ? (
            <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <CircleCheck className="w-3.5 h-3.5" /> La zi — fără restanțe
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">{owed.length} {owed.length === 1 ? 'plată neachitată' : 'plăți neachitate'}</p>
          )}
        </div>
        <div className="p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-400">
            <TrendingUp className="w-3.5 h-3.5" /> Studioul îi datorează
          </div>
          <p className={`text-2xl font-extrabold mt-1 ${totalCredit > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {totalCredit.toLocaleString()} <span className="text-xs font-semibold text-slate-400">MDL</span>
          </p>
          <p className="text-xs text-slate-400 mt-1" title="Credit pentru lecții motivate neefectuate — deja scăzut din suma de mai sus, pe rândul neachitat corespunzător.">
            {totalCredit > 0 ? 'credit pentru absențe motivate' : 'niciun credit activ'}
          </p>
        </div>
      </div>
      {(owed.length > 0 || creditRows.length > 0) && (
        <div className="px-3.5 py-2.5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 space-y-1.5">
          {owed.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PAYMENT_DOT[p.status]}`} />
                <span className="truncate">
                  {MONTHS[p.month - 1]} {p.year}{p.service ? ` · ${p.service}` : ''}
                  {isOverageTopUpRow(p.notes) && <span className="ml-1 text-amber-600 dark:text-amber-400 font-semibold">(supliment peste abonament)</span>}
                </span>
              </span>
              <span className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-400">{PAYMENT_LABEL[p.status]}</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{Number(p.amount).toLocaleString()} MDL</span>
              </span>
            </div>
          ))}
          {creditRows.map(({ p, money }) => (
            <div key={`credit-${p.id}`} className="flex items-center justify-between gap-2 text-xs text-sky-600 dark:text-sky-400">
              <span className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">↩ {MONTHS[p.month - 1]} {p.year}{p.service ? ` · ${p.service}` : ''} — credit deja scăzut</span>
              </span>
              <span className="font-bold flex-shrink-0">−{money.toLocaleString()} MDL</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PaymentForm({ open, onClose, onSaved, payment, defaultStudentId, defaultMonth, defaultYear, showToast }: Props) {
  const [form, setForm]     = useState(blank);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  // One instrument at a time keeps a single service/status; a student with
  // several instruments gets a stacked row per instrument, each with its own
  // status/amount — shown both when creating AND when editing, so editing one
  // payment still shows the full picture across all of that student's
  // abonamente instead of hiding the others. Each row remembers the existing
  // payment `id` for that instrument/period (if any) so saving updates it
  // instead of creating a duplicate.
  const [perInstrument, setPerInstrument] = useState<Record<string, { status: string; amount: string; id?: number; notes?: string | null; comment?: string }>>({});
  // An instrument with more than one row this period (the subscription plus
  // a separate overage top-up, say) can't be safely edited as a single
  // Sumă+Status pair here without risking silently updating the wrong one —
  // shown read-only instead, pointing at the list where each row is its own
  // line with its own edit/delete.
  const [splitInstruments, setSplitInstruments] = useState<Set<string>>(new Set());
  const { data: studentsData } = useSWR('/api/students', fetcher);
  const students = studentsData?.students ?? [];
  const selectedStudent = students.find((s: { id: number }) => String(s.id) === form.student_id);
  const studentSubs: StudentSubscription[] = selectedStudent?.subscriptions ?? [];
  const isMultiInstrument = studentSubs.length > 1;

  // Full payment history for the selected student — "vedea rapid situația plăților pentru fiecare lună".
  const { data: historyData, mutate: mutateHistory } = useSWR(
    form.student_id ? `/api/payments?student_id=${form.student_id}` : null, fetcher,
  );
  const history: Payment[] = (historyData?.payments ?? [])
    .filter((p: Payment) => !payment || p.id !== payment.id)
    .sort((a: Payment, b: Payment) => (b.year - a.year) || (b.month - a.month));
  // Unlike `history` above, this never hides the row currently being edited —
  // her debts/credit must stay accurate even while that exact row is open.
  const fullHistory: Payment[] = (historyData?.payments ?? [])
    .slice().sort((a: Payment, b: Payment) => (b.year - a.year) || (b.month - a.month));

  useEffect(() => {
    if (payment) {
      setForm({
        ...blank,
        student_id: String(payment.student_id),
        // Preserve the original service/plan/lesson-count instead of resetting
        // to defaults — otherwise saving an edit silently overwrites them.
        service: payment.service ?? blank.service,
        plan: (payment.plan_type as PlanType) ?? blank.plan,
        lessons: (payment.lesson_count as LessonCount) ?? blank.lessons,
        amount: String(payment.amount),
        month: String(payment.month),
        year: String(payment.year),
        status: payment.status,
        payment_date: payment.payment_date ?? todayMoldova(),
        comment: payment.comment ?? '',
      });
    } else {
      const initialAmount = subscriptionAmount(blank.service, blank.plan, blank.lessons);
      setForm({
        ...blank,
        payment_date: todayMoldova(),
        student_id: defaultStudentId ? String(defaultStudentId) : '',
        month: String(defaultMonth ?? now.getMonth() + 1),
        year: String(defaultYear ?? now.getFullYear()),
        amount: initialAmount != null ? String(initialAmount) : '',
      });
    }
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment, open, defaultStudentId]);

  // Multi-instrument mode: seed one status/amount row per subscription,
  // pulling in whatever payment already exists for that instrument in the
  // selected month/year (so editing shows real, saved statuses instead of
  // just defaults) — falls back to the computed subscription price for any
  // instrument that has no payment yet this period.
  useEffect(() => {
    if (studentSubs.length <= 1) { setPerInstrument({}); return; }
    const monthNum = Number(form.month), yearNum = Number(form.year);
    const periodPayments: Payment[] = (historyData?.payments ?? []).filter(
      (p: Payment) => p.month === monthNum && p.year === yearNum,
    );
    const split = new Set<string>();
    setPerInstrument(() => {
      const next: Record<string, { status: string; amount: string; id?: number; notes?: string | null; comment?: string }> = {};
      for (const sub of studentSubs) {
        const rows = periodPayments.filter((p: Payment) => p.service === sub.instrument);
        if (rows.length > 1) {
          split.add(sub.instrument);
          // Still seeded (so the totals/labels below have something to show),
          // but handleSubmit skips anything in `split` entirely.
          const main = rows.find(r => !isOverageTopUpRow(r.notes)) ?? rows[0];
          next[sub.instrument] = { status: main.status, amount: String(rows.reduce((s, r) => s + r.amount, 0)), notes: main.notes ?? null, comment: main.comment ?? '' };
          continue;
        }
        const existing = rows[0];
        if (existing) {
          next[sub.instrument] = { status: existing.status, amount: String(existing.amount), id: existing.id, notes: existing.notes ?? null, comment: existing.comment ?? '' };
        } else {
          const computed = subscriptionAmount(sub.instrument, sub.plan, sub.lessons);
          next[sub.instrument] = { status: 'unpaid', amount: computed != null ? String(computed) : '', notes: planSummary(sub.instrument, sub.plan, sub.lessons), comment: '' };
        }
      }
      return next;
    });
    setSplitInstruments(split);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.student_id, form.month, form.year, studentSubs.length, historyData]);

  const svc = PRICING[form.service];
  const isFlat = svc?.flatMonthly != null;

  const computedAmount = useMemo(
    () => subscriptionAmount(form.service, form.plan, form.lessons),
    [form.service, form.plan, form.lessons],
  );
  const perLesson = useMemo(
    () => perLessonPrice(form.service, form.plan),
    [form.service, form.plan],
  );

  // Amount always follows the abonament selectors, like a calculator — picking
  // a different service/plan/nr. de lecții recomputes it immediately. Only
  // skipped while editing an existing payment (its amount stays as saved).
  useEffect(() => {
    if (payment) return;
    setForm(prev => ({
      ...prev,
      amount: computedAmount != null ? String(computedAmount) : prev.amount,
    }));
  }, [computedAmount, form.service, form.plan, form.lessons, payment]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sid = e.target.value;
    const stu = students.find((s: { id: number }) => String(s.id) === sid);
    const subs: StudentSubscription[] = stu?.subscriptions ?? [];
    setForm(prev => ({
      ...prev, student_id: sid,
      service: subs[0]?.instrument ?? prev.service,
      plan: subs[0]?.plan ?? prev.plan,
      lessons: subs[0]?.lessons ?? prev.lessons,
    }));
    setErrors(prev => ({ ...prev, student_id: false }));
  };

  /** Picking a service from the student's own abonamente also loads its plan + nr. lecții. */
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const service = e.target.value;
    const sub = studentSubs.find(s => s.instrument === service);
    setForm(prev => ({ ...prev, service, plan: sub?.plan ?? prev.plan, lessons: sub?.lessons ?? prev.lessons }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id) { setErrors({ student_id: true }); return; }
    if (!isMultiInstrument && !form.amount) { setErrors({ amount: true }); return; }
    setLoading(true);
    try {
      if (isMultiInstrument) {
        // One payment per instrument, each with its own status/amount — PUT
        // to the existing row when this instrument already has a payment for
        // this period, otherwise POST a new one.
        // Paused instruments are read-only here (system-managed by
        // createMonthlyPayments) — never submitted from this form.
        const results = await Promise.all(studentSubs.filter(sub => sub.status !== 'paused' && !splitInstruments.has(sub.instrument)).map(sub => {
          const row = perInstrument[sub.instrument] ?? { status: 'unpaid', amount: '' };
          const fallbackAmount = subscriptionAmount(sub.instrument, sub.plan, sub.lessons);
          // `Number(row.amount) || fallbackAmount` would silently replace an
          // intentional 0 (JS treats 0 as falsy) with the computed subscription
          // price — only fall back when the field was actually left empty.
          const amount = row.amount === '' ? (fallbackAmount ?? 0) : (Number(row.amount) || 0);
          const body = JSON.stringify({
            student_id: Number(form.student_id),
            amount,
            month: Number(form.month),
            year: Number(form.year),
            status: row.status,
            payment_date: form.payment_date || todayMoldova(),
            due_date: null,
            // `notes` is the system's own credit recalculation line — passed
            // through untouched, never set from this form, so the admin's
            // comment below can never clobber it (and vice versa).
            notes: row.notes ?? null,
            comment: row.comment || null,
            plan_type: sub.plan,
            lesson_count: sub.lessons,
            price_per_lesson: perLessonPrice(sub.instrument, sub.plan),
            service: sub.instrument,
          });
          return row.id
            ? fetch(`/api/payments/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body })
            : fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        }));
        if (results.every(r => r.ok)) {
          showToast('Plăți înregistrate!', 'success');
          mutateHistory();
          onSaved();
          onClose();
        } else {
          showToast('Eroare la salvarea uneia sau mai multor plăți', 'error');
        }
        return;
      }

      const url    = payment ? `/api/payments/${payment.id}` : '/api/payments';
      const method = payment ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: Number(form.student_id),
          amount: Number(form.amount),
          month: Number(form.month),
          year: Number(form.year),
          status: form.status,
          payment_date: form.payment_date || todayMoldova(),
          due_date: null,
          // `notes` is the system's own descriptive/credit line, never edited
          // here — preserved as-is when editing, auto-filled when creating.
          notes: payment ? (payment.notes ?? null) : planSummary(form.service, form.plan, form.lessons),
          comment: form.comment || null,
          // structured plan info (API stores if columns exist, otherwise ignores)
          plan_type: isFlat ? null : form.plan,
          lesson_count: isFlat ? null : form.lessons,
          price_per_lesson: isFlat ? null : perLesson,
          service: form.service,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? 'Eroare la salvare', 'error');
      } else {
        showToast(payment ? 'Plată actualizată!' : 'Plată înregistrată!', 'success');
        mutateHistory();
        onSaved();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={payment ? 'Editează plată' : 'Înregistrează plată'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Elev"
          value={form.student_id}
          onChange={handleStudentChange}
          shake={errors.student_id}
          placeholder="Selectează elev"
          options={students.map((s: { id: number; name: string }) => ({ value: s.id, label: s.name }))}
        />

        {form.student_id && <FinancialSnapshot history={fullHistory} />}

        {isMultiInstrument ? (
          <div className="rounded-xl border border-brand-200 dark:border-brand-900/50 bg-brand-50/60 dark:bg-brand-900/15 p-3 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">Abonamente — o plată pentru fiecare instrument</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">Acest elev are {studentSubs.length} abonamente — alege statusul pentru fiecare.</p>
            <div className="flex flex-col gap-2">
              {studentSubs.map(sub => {
                const subFlat = PRICING[sub.instrument]?.flatMonthly != null;
                const subPerLesson = perLessonPrice(sub.instrument, sub.plan);
                const row = perInstrument[sub.instrument] ?? { status: 'unpaid', amount: '' };
                // A paused instrument's payment is system-managed (createMonthlyPayments
                // keeps it at 0 lei / status 'paused') — shown read-only here instead of
                // an editable Sumă+Status pair, so nobody can manually bill an instrument
                // the student isn't actually taking right now.
                const isPaused = sub.status === 'paused';
                const isSplit = splitInstruments.has(sub.instrument);
                return (
                  <div key={sub.instrument} className="rounded-lg border border-brand-200/70 dark:border-brand-900/40 bg-white/70 dark:bg-slate-900/30 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{PRICING[sub.instrument]?.label ?? sub.instrument}</p>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {sub.plan === 'old' ? 'vechi' : 'nou'} · {sub.lessons} lecții {subFlat ? '' : `· ${subPerLesson} lei/lecție`}
                      </span>
                    </div>
                    {isPaused ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                        Pauză — fără taxă luna aceasta
                      </div>
                    ) : isSplit ? (
                      <div className="flex flex-col gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2.5 py-2">
                        <span>Are mai multe plăți luna asta (abonament + supliment peste abonament) — total {Number(perInstrument[sub.instrument]?.amount ?? 0).toLocaleString()} MDL.</span>
                        <span className="font-normal text-amber-600 dark:text-amber-500">Editează-le separat, din lista de Plăți.</span>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="Sumă (MDL)"
                            value={row.amount}
                            onChange={e => setPerInstrument(prev => ({ ...prev, [sub.instrument]: { ...row, amount: e.target.value } }))}
                            type="number" min={0}
                          />
                          <Select
                            label="Status"
                            value={row.status}
                            onChange={e => setPerInstrument(prev => ({ ...prev, [sub.instrument]: { ...row, status: e.target.value } }))}
                            options={[
                              { value: 'paid',    label: 'Plătit'   },
                              { value: 'unpaid',  label: 'Neplătit' },
                              { value: 'partial', label: 'Parțial'  },
                            ]}
                          />
                        </div>
                        {/* `row.notes` is the system's credit recalculation line — shown
                            here read-only, never mixed with the admin's own comment below.
                            (A brand-new row's `notes` is just a plan summary, not a credit,
                            so it's skipped here — it'd only duplicate the line above.) */}
                        {row.notes?.startsWith('Credit') && (
                          <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">↩ {row.notes}</p>
                        )}
                        <Input
                          label="Comentariu (opțional)"
                          value={row.comment ?? ''}
                          onChange={e => setPerInstrument(prev => ({ ...prev, [sub.instrument]: { ...row, comment: e.target.value } }))}
                          placeholder="Un aspect despre plată sau elev…"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-brand-200 dark:border-brand-900/50 bg-brand-50/60 dark:bg-brand-900/15 p-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">Abonament — pentru ce instrument e plata</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Serviciu"
                value={form.service}
                onChange={handleServiceChange}
                options={
                  studentSubs.length > 0
                    ? studentSubs.map(s => ({ value: s.instrument, label: `${PRICING[s.instrument]?.label ?? s.instrument} — ${s.lessons} lecții (${s.plan === 'old' ? 'vechi' : 'nou'})` }))
                    : SERVICE_KEYS.map(k => ({ value: k, label: PRICING[k].label }))
                }
              />
              <Select
                label="Tip abonament"
                value={form.plan}
                onChange={set('plan')}
                disabled={isFlat}
                options={[
                  { value: 'old', label: 'Abonament vechi' },
                  { value: 'new', label: 'Abonament nou' },
                ]}
              />
            </div>
            {!isFlat && !payment && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Număr de lecții / lună</label>
                <div className="flex gap-2">
                  {LESSON_COUNTS.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, lessons: n }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors
                        ${form.lessons === n
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-brand-400'}`}
                    >
                      {n} lecții
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-brand-200/50 dark:border-brand-900/30">
              {isFlat ? (
                <span>Lecție de grup — {svc?.flatMonthly} lei / lună</span>
              ) : (
                <span>Preț per lecție ({form.plan === 'old' ? 'vechi' : 'nou'}): <strong className="text-slate-700 dark:text-slate-200">{perLesson} lei</strong></span>
              )}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Total: {computedAmount != null ? `${computedAmount} lei/lună` : '—'}
              </span>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-2 ${isMultiInstrument ? 'sm:grid-cols-3' : 'sm:grid-cols-4'} gap-4`}>
          {!isMultiInstrument && (
            <Input
              label="Sumă (MDL)"
              value={form.amount}
              onChange={set('amount')}
              shake={errors.amount}
              type="number" min={0}
            />
          )}
          <Select label="Lună" value={form.month} onChange={set('month')} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
          <Input label="An" value={form.year} onChange={set('year')} type="number" min={2020} max={2100} />
          {!isMultiInstrument && (
            <Select
              label="Status"
              value={form.status}
              onChange={set('status')}
              options={[
                { value: 'paid',    label: 'Plătit'   },
                { value: 'unpaid',  label: 'Neplătit' },
                { value: 'partial', label: 'Parțial'  },
              ]}
            />
          )}
          <Input label="Data" value={form.payment_date} onChange={set('payment_date')} type="date" className="col-span-2 sm:col-span-1" />
        </div>

        {/* Multi-instrument students have their own comment field per
            instrument card above instead — a single shared one here would
            apply the same text to every instrument's payment. */}
        {!isMultiInstrument && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Comentariu</label>
          <textarea
            value={form.comment}
            onChange={set('comment')}
            rows={2}
            placeholder="Un aspect despre plată sau elev…"
            className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800
              text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>
        )}

        {form.student_id && history.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Istoric plăți — {selectedStudent?.name}
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {history.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PAYMENT_DOT[p.status] ?? 'bg-slate-400'}`} />
                    {MONTHS[p.month - 1]} {p.year}{p.service ? ` · ${p.service}` : ''}
                  </span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-slate-400">{PAYMENT_LABEL[p.status] ?? p.status}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{Number(p.amount).toLocaleString()} MDL</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Anulează</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Se salvează…' : payment ? 'Salvează' : 'Înregistrează plată'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
