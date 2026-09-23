'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Payment, MONTHS, StudentSubscription } from '@/lib/types';
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
  status: 'unpaid', payment_date: todayMoldova(), notes: '',
};

const PAYMENT_LABEL: Record<string, string> = { paid: 'Plătit', unpaid: 'Neplătit', partial: 'Parțial', overdue: 'Restant' };
const PAYMENT_DOT: Record<string, string> = {
  paid: 'bg-emerald-500', partial: 'bg-orange-500', unpaid: 'bg-red-500', overdue: 'bg-red-500',
};

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
  const [perInstrument, setPerInstrument] = useState<Record<string, { status: string; amount: string; id?: number; notes?: string }>>({});
  // Only overwrite the per-instrument notes if the user actually typed a note.
  const [noteEdited, setNoteEdited] = useState(false);
  const { data: studentsData } = useSWR('/api/students', fetcher);
  const students = studentsData?.students ?? [];
  const selectedStudent = students.find((s: { id: number }) => String(s.id) === form.student_id);
  const studentSubs: StudentSubscription[] = selectedStudent?.subscriptions ?? [];
  const isMultiInstrument = studentSubs.length > 1;

  // Full payment history for the selected student — "vedea rapid situația plăților pentru fiecare lună".
  const { data: historyData } = useSWR(
    form.student_id ? `/api/payments?student_id=${form.student_id}` : null, fetcher,
  );
  const history: Payment[] = (historyData?.payments ?? [])
    .filter((p: Payment) => !payment || p.id !== payment.id)
    .sort((a: Payment, b: Payment) => (b.year - a.year) || (b.month - a.month));

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
        notes: payment.notes ?? '',
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
        notes: planSummary(blank.service, blank.plan, blank.lessons),
      });
    }
    setErrors({});
    setNoteEdited(false);
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
    setPerInstrument(() => {
      const next: Record<string, { status: string; amount: string; id?: number; notes?: string }> = {};
      for (const sub of studentSubs) {
        const existing = periodPayments.find((p: Payment) => p.service === sub.instrument);
        if (existing) {
          next[sub.instrument] = { status: existing.status, amount: String(existing.amount), id: existing.id, notes: existing.notes ?? '' };
        } else {
          const computed = subscriptionAmount(sub.instrument, sub.plan, sub.lessons);
          next[sub.instrument] = { status: 'unpaid', amount: computed != null ? String(computed) : '', notes: planSummary(sub.instrument, sub.plan, sub.lessons) };
        }
      }
      return next;
    });
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
      notes: planSummary(prev.service, prev.plan, prev.lessons),
    }));
  }, [computedAmount, form.service, form.plan, form.lessons, payment]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (field === 'notes') setNoteEdited(true);
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
        const results = await Promise.all(studentSubs.map(sub => {
          const row = perInstrument[sub.instrument] ?? { status: 'unpaid', amount: '' };
          const fallbackAmount = subscriptionAmount(sub.instrument, sub.plan, sub.lessons);
          const body = JSON.stringify({
            student_id: Number(form.student_id),
            amount: Number(row.amount) || fallbackAmount || 0,
            month: Number(form.month),
            year: Number(form.year),
            status: row.status,
            payment_date: form.payment_date || todayMoldova(),
            due_date: null,
            notes: (noteEdited ? form.notes : row.notes) || null,
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
          notes: form.notes || null,
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

        {isMultiInstrument ? (
          <div className="rounded-xl border border-brand-200 dark:border-brand-900/50 bg-brand-50/60 dark:bg-brand-900/15 p-3 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">Abonamente — o plată pentru fiecare instrument</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">Acest elev are {studentSubs.length} abonamente — alege statusul pentru fiecare.</p>
            <div className="flex flex-col gap-2">
              {studentSubs.map(sub => {
                const subFlat = PRICING[sub.instrument]?.flatMonthly != null;
                const subPerLesson = perLessonPrice(sub.instrument, sub.plan);
                const row = perInstrument[sub.instrument] ?? { status: 'unpaid', amount: '' };
                return (
                  <div key={sub.instrument} className="rounded-lg border border-brand-200/70 dark:border-brand-900/40 bg-white/70 dark:bg-slate-900/30 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{PRICING[sub.instrument]?.label ?? sub.instrument}</p>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {sub.plan === 'old' ? 'vechi' : 'nou'} · {sub.lessons} lecții {subFlat ? '' : `· ${subPerLesson} lei/lecție`}
                      </span>
                    </div>
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

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Note</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            placeholder="Note despre plată…"
            className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800
              text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>

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

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Anulează</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Se salvează…' : payment ? 'Salvează' : 'Înregistrează plată'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
