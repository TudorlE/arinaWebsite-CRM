'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Plus, Search, Pencil, Trash2, Filter, CreditCard, Clock, CheckCircle2, Activity, Target, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge, { paymentBadge, paymentLabel } from '@/components/ui/Badge';
import PaymentForm from '@/components/payments/PaymentForm';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import AccessDenied from '@/components/AccessDenied';
import PageBanner from '@/components/ui/PageBanner';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Payment, MONTHS, Student, StudentSubscription } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const now = new Date();
const YEARS = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i);

interface RevenueSummary {
  total: number;
  monthRevenue: number;
  outstanding: number;
  outstandingCount: number;
  paidCount: number;
  unpaidCount: number;
  partialCount: number;
  paidPercentage: number;
}

export default function PaymentsPage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter]   = useState(String(now.getMonth() + 1));
  const [yearFilter, setYearFilter]     = useState(String(now.getFullYear()));
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [editPayment, setEditPayment]   = useState<Payment | null>(null);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const { toasts, toast, remove }       = useToast();

  const params = new URLSearchParams();
  if (monthFilter)  params.set('month',  monthFilter);
  params.set('year', yearFilter);
  if (statusFilter) params.set('status', statusFilter);

  const { data, mutate } = useSWR(`/api/payments?${params}`, fetcher, { keepPreviousData: true });
  const allPayments: Payment[] = data?.payments ?? [];

  // Unfiltered-by-status view of the same month/year, used only to compute the
  // per-instrument paid/partial/unpaid breakdown shown next to multi-instrument
  // students — the status filter above must never hide an instrument from that
  // breakdown, or it'd recreate the exact "looked paid, wasn't" confusion.
  const periodParams = new URLSearchParams();
  if (monthFilter) periodParams.set('month', monthFilter);
  periodParams.set('year', yearFilter);
  const { data: periodData } = useSWR(`/api/payments?${periodParams}`, fetcher, { keepPreviousData: true });
  const periodPayments: Payment[] = periodData?.payments ?? [];

  // Student status lookup — paused/inactive students are hidden by default (req. 11).
  const { data: studentsData } = useSWR('/api/students', fetcher);
  const studentStatusById = new Map<number, string>((studentsData?.students ?? []).map((s: Student) => [s.id, s.status ?? 'active']));
  const studentSubsById = new Map<number, StudentSubscription[]>((studentsData?.students ?? []).map((s: Student) => [s.id, s.subscriptions ?? []]));

  /** Per-instrument status for a student this period — 'unpaid' when no payment row exists yet, matching PaymentForm's own fallback. */
  const instrumentStatus = (studentId: number, instrument: string): Payment['status'] =>
    periodPayments.find(p => p.student_id === studentId && p.service === instrument)?.status ?? 'unpaid';

  const revenueParams = new URLSearchParams();
  if (monthFilter) revenueParams.set('month', monthFilter);
  revenueParams.set('year', yearFilter);
  const { data: revenueData, mutate: mutateRevenue } = useSWR<{ summary: RevenueSummary }>(
    `/api/payments/revenue?${revenueParams}`, fetcher, { refreshInterval: 60_000 },
  );
  const summary = revenueData?.summary;

  const payments = allPayments
    .filter(p => !search || p.student_name?.toLowerCase().includes(search.toLowerCase()))
    .filter(p => showInactive || (studentStatusById.get(p.student_id) ?? 'active') === 'active');

  // Derived totals (from the filtered list)
  const paidAmt    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const unpaidAmt  = payments.filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
  const partialAmt = payments.filter(p => p.status === 'partial').reduce((s, p) => s + p.amount, 0);

  // A multi-instrument student used to appear as one row PER instrument, each
  // with its own paid/unpaid badge — misleading (one row says "Plătit" while
  // a sibling row for the same student says "Neplătit") and cluttered (2+
  // rows for what's really one student's payment this month). Collapsed here
  // into a single row per student, with one correctly-aggregated status
  // (paid only if every instrument is paid) and the per-instrument
  // breakdown as supporting detail underneath.
  type DisplayRow =
    | { kind: 'single'; payment: Payment; sortKey: string }
    | { kind: 'group'; studentId: number; studentName: string; subs: StudentSubscription[]; ids: number[]; totalAmount: number; overallStatus: Payment['status']; sortKey: string };

  const multiStudentIds = new Set(
    payments.filter(p => (studentSubsById.get(p.student_id) ?? []).length > 1).map(p => p.student_id),
  );

  const displayRows: DisplayRow[] = [];
  for (const p of payments) {
    if (multiStudentIds.has(p.student_id)) continue;
    displayRows.push({ kind: 'single', payment: p, sortKey: p.created_at });
  }
  for (const studentId of multiStudentIds) {
    const subs = studentSubsById.get(studentId) ?? [];
    const studentName = payments.find(p => p.student_id === studentId)?.student_name ?? '';
    const ids: number[] = [];
    let totalAmount = 0;
    let sortKey = '';
    let anyPaid = false, anyUnpaid = false, anyPartial = false;
    for (const sub of subs) {
      const match = periodPayments.find(pp => pp.student_id === studentId && pp.service === sub.instrument);
      const st = match?.status ?? 'unpaid';
      if (match) {
        ids.push(match.id);
        totalAmount += match.amount;
        if (match.created_at > sortKey) sortKey = match.created_at;
      }
      if (st === 'paid') anyPaid = true; else if (st === 'partial') anyPartial = true; else anyUnpaid = true;
    }
    const overallStatus: Payment['status'] = anyPartial || (anyPaid && anyUnpaid) ? 'partial' : anyUnpaid ? 'unpaid' : 'paid';
    displayRows.push({ kind: 'group', studentId, studentName, subs, ids, totalAmount, overallStatus, sortKey });
  }

  // List reads bottom-up: oldest at top, most recent added at the bottom.
  const sorted = displayRows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const summaryTotal = (summary?.paidCount ?? 0) + (summary?.unpaidCount ?? 0) + (summary?.partialCount ?? 0);
  const pct = (n: number) => summaryTotal > 0 ? Math.round((n / summaryTotal) * 100) : 0;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const results = await Promise.all(deleteTarget.ids.map(id => fetch(`/api/payments/${id}`, { method: 'DELETE' })));
      if (results.every(r => r.ok)) { toast('Plată ștearsă', 'success'); mutate(); mutateRevenue(); }
      else toast('Eroare la ștergere', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const [generating, setGenerating] = useState(false);
  const handleGenerateMissing = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/payments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: Number(monthFilter), year: Number(yearFilter) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`${data.created} plăți adăugate (${data.skipped} existau deja)`, 'success');
        mutate(); mutateRevenue();
      } else {
        toast(data.error ?? 'Eroare la generare', 'error');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (ids: number[]) => {
    await Promise.all(ids.map(id => fetch(`/api/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    })));
    mutate();
    mutateRevenue();
    toast('Marcat ca plătit!', 'success');
  };



  if (role === 'administrator') return <AccessDenied title="Plăți" />;

  return (
    <div className="flex flex-col flex-1">
      <PageBanner
        icon={CreditCard}
        title="Plăți"
        subtitle={<>{MONTHS[Number(monthFilter) - 1]} — situația plăților{summary && <span className="ml-2 opacity-80">· {summary.paidPercentage}% colectat</span>}</>}
        accent="#10B981"
      />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* ── Collection rate progress bar ───────────────── */}
        {summary && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-500" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Rată de colectare</p>
                <span className="text-xs text-slate-400 dark:text-slate-500">— {MONTHS[Number(monthFilter) - 1]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{summary.paidPercentage}%</span>
                <span className="text-xs text-slate-400">din {summaryTotal} plăți</span>
              </div>
            </div>
            {/* Stacked progress bar */}
            <div className="h-4 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
              <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" title="Plătit"
                style={{ width: `${pct(summary.paidCount)}%` }} />
              <div className="h-full bg-orange-400 transition-all duration-700 ease-out" title="Parțial"
                style={{ width: `${pct(summary.partialCount)}%` }} />
              <div className="h-full bg-red-400 transition-all duration-700 ease-out" title="Neplătit"
                style={{ width: `${pct(summary.unpaidCount)}%` }} />
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
              {[
                { label: 'Plătit',   color: 'bg-emerald-500', count: summary.paidCount,    amt: paidAmt },
                { label: 'Parțial',  color: 'bg-orange-400',  count: summary.partialCount, amt: partialAmt },
                { label: 'Neplătit', color: 'bg-red-400',     count: summary.unpaidCount,  amt: unpaidAmt },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.count}</span>
                  <span className="text-slate-400">({item.amt.toLocaleString()} MDL)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Summary cards ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Colectat */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                {pct(summary?.paidCount ?? 0)}%
              </span>
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{paidAmt.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">MDL colectat</p>
            <p className="text-xs text-slate-400 mt-1">{summary?.paidCount ?? 0} plăți confirmate</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
              <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${pct(summary?.paidCount ?? 0)}%` }} />
            </div>
          </div>
          {/* Neplătit */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                {pct(summary?.unpaidCount ?? 0)}%
              </span>
            </div>
            <p className="text-2xl font-extrabold text-red-500 dark:text-red-400">{unpaidAmt.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">MDL neplătit</p>
            <p className="text-xs text-slate-400 mt-1">{summary?.unpaidCount ?? 0} în așteptare</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
              <div className="h-full bg-red-400 transition-all duration-700" style={{ width: `${pct(summary?.unpaidCount ?? 0)}%` }} />
            </div>
          </div>
          {/* Total */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-4 shadow-md">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                {summary?.paidPercentage ?? 0}% rata
              </span>
            </div>
            <p className="text-2xl font-extrabold text-white">{(summary?.total ?? 0).toLocaleString()}</p>
            <p className="text-[10px] text-white/70 font-medium uppercase tracking-wide">MDL total încasări</p>
            <p className="text-xs text-white/60 mt-1">Toate perioadele</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div className="h-full bg-white/60" style={{ width: `${summary?.paidPercentage ?? 0}%` }} />
            </div>
          </div>
        </div>

        {/* ── Toolbar ────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Caută elev…"
              className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800
                text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                transition-shadow duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Filtre</span>
            </div>
            <Select
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
              className="min-w-28 text-sm"
            />
            <Select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              options={YEARS.map(y => ({ value: y, label: String(y) }))}
              className="min-w-20 text-sm"
            />
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              placeholder="Toate statusurile"
              options={[
                { value: 'paid',    label: '✓ Plătit'   },
                { value: 'unpaid',  label: '⏳ Neplătit' },
                { value: 'partial', label: '◐ Parțial'  },
              ]}
              className="min-w-32 text-sm"
            />
            {statusFilter && (
              <button
                onClick={() => setStatusFilter('')}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors"
              >
                <X className="w-3 h-3" /> Resetează
              </button>
            )}
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
              Arată și inactivi/pauză
            </label>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {payments.length > 0 && (
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                {payments.length} plăți
              </span>
            )}
            <Button variant="secondary" onClick={handleGenerateMissing} disabled={generating} title="Adaugă o plată Neplătit pentru fiecare elev/instrument activ care nu are încă o plată în luna selectată">
              {generating ? 'Se generează…' : 'Generează plăți lipsă'}
            </Button>
            <Button onClick={() => { setEditPayment(null); setEditStudentId(null); setShowForm(true); }}>
              <Plus className="w-4 h-4" /> Înregistrează plată
            </Button>
          </div>
        </div>

        {/* ── Payments list — oldest at top, most recent at the bottom ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <CreditCard className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Nicio plată înregistrată</p>
            </div>
          ) : sorted.map(row => {
            if (row.kind === 'single') {
              const payment = row.payment;
              const isPaid    = payment.status === 'paid';
              const isPartial = payment.status === 'partial';
              const dotColor =
                isPaid    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                isPartial ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' :
                            'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
              return (
                <div key={`p${payment.id}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${dotColor}`}>
                    {(payment.student_name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{payment.student_name}</p>
                      <Badge variant={paymentBadge(payment.status)} className="flex-shrink-0">{paymentLabel(payment.status)}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {payment.service ?? (payment.instruments ?? []).join(', ')} · {MONTHS[payment.month - 1]} {payment.year}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">{payment.amount.toLocaleString()} <span className="text-xs font-medium text-slate-400">MDL</span></p>
                    {payment.payment_date && (
                      <div className="flex items-center justify-end gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                        {isPaid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        {payment.payment_date}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {!isPaid && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkPaid([payment.id])}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">Plătit</span>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setEditPayment(payment); setEditStudentId(null); setShowForm(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ ids: [payment.id], label: payment.student_name ?? '' })}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            }

            // Multi-instrument student — one row, one correctly-aggregated
            // status, with each instrument's own status as supporting detail.
            const isPaid    = row.overallStatus === 'paid';
            const isPartial = row.overallStatus === 'partial';
            const dotColor =
              isPaid    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
              isPartial ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' :
                          'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
            return (
              <div key={`s${row.studentId}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${dotColor}`}>
                  {(row.studentName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{row.studentName}</p>
                    <Badge variant={paymentBadge(row.overallStatus)} className="flex-shrink-0">{paymentLabel(row.overallStatus)}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {row.subs.map(sub => {
                      const st = instrumentStatus(row.studentId, sub.instrument);
                      return (
                        <span
                          key={sub.instrument}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${st === 'paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : st === 'partial' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}
                        >
                          {sub.instrument} · {paymentLabel(st)}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">{row.totalAmount.toLocaleString()} <span className="text-xs font-medium text-slate-400">MDL</span></p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {!isPaid && row.ids.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(row.ids)}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">Plătit</span>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setEditPayment(null); setEditStudentId(row.studentId); setShowForm(true); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {row.ids.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ ids: row.ids, label: row.studentName })}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <PaymentForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditStudentId(null); }}
        onSaved={() => { mutate(); mutateRevenue(); }}
        payment={editPayment}
        defaultStudentId={editStudentId ?? undefined}
        showToast={toast}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge plată" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Șterge plata pentru <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.label}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Anulează</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Se șterge…' : 'Șterge'}
          </Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
