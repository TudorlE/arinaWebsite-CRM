'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Plus, Search, Pencil, Trash2, Filter, CreditCard, TrendingUp, Clock, CheckCircle2, Activity, Zap, Target, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge, { paymentBadge, paymentLabel } from '@/components/ui/Badge';
import PaymentForm from '@/components/payments/PaymentForm';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Payment, MONTHS } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const now = new Date();

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
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter]   = useState(String(now.getMonth() + 1));
  const [showForm, setShowForm]         = useState(false);
  const [editPayment, setEditPayment]   = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const { toasts, toast, remove }       = useToast();

  const params = new URLSearchParams();
  if (monthFilter)  params.set('month',  monthFilter);
  params.set('year', String(now.getFullYear()));
  if (statusFilter) params.set('status', statusFilter);

  const { data, mutate } = useSWR(`/api/payments?${params}`, fetcher, { keepPreviousData: true });
  const allPayments: Payment[] = data?.payments ?? [];

  const revenueParams = new URLSearchParams();
  if (monthFilter) revenueParams.set('month', monthFilter);
  revenueParams.set('year', String(now.getFullYear()));
  const { data: revenueData, mutate: mutateRevenue } = useSWR<{ summary: RevenueSummary }>(
    `/api/payments/revenue?${revenueParams}`, fetcher, { refreshInterval: 60_000 },
  );
  const summary = revenueData?.summary;

  const payments = allPayments.filter(p =>
    !search || p.student_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Derived totals (from the filtered list)
  const total     = payments.length;
  const paidAmt    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const unpaidAmt  = payments.filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
  const partialAmt = payments.filter(p => p.status === 'partial').reduce((s, p) => s + p.amount, 0);

  // Sort: unpaid/partial first, then paid
  const sorted = useMemo(() => [
    ...payments.filter(p => p.status === 'unpaid'),
    ...payments.filter(p => p.status === 'partial'),
    ...payments.filter(p => p.status === 'paid'),
  ], [payments]);

  const summaryTotal = (summary?.paidCount ?? 0) + (summary?.unpaidCount ?? 0) + (summary?.partialCount ?? 0);
  const pct = (n: number) => summaryTotal > 0 ? Math.round((n / summaryTotal) * 100) : 0;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/payments/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast('Plată ștearsă', 'success'); mutate(); mutateRevenue(); }
      else toast('Eroare la ștergere', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleMarkPaid = async (payment: Payment) => {
    await fetch(`/api/payments/${payment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    });
    mutate();
    mutateRevenue();
    toast('Marcat ca plătit!', 'success');
  };



  return (
    <div className="flex flex-col flex-1">
      {/* ── Page Banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Plăți</h1>
              <p className="text-emerald-100 text-sm font-medium mt-0.5">
                {MONTHS[Number(monthFilter) - 1]} — situația plăților
                {summary && <span className="ml-2 opacity-80">· {summary.paidPercentage}% colectat</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

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
              <div className="h-full bg-accent-400 transition-all duration-700 ease-out" title="Parțial"
                style={{ width: `${pct(summary.partialCount)}%` }} />
              <div className="h-full bg-amber-400 transition-all duration-700 ease-out" title="Neplătit"
                style={{ width: `${pct(summary.unpaidCount)}%` }} />
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
              {[
                { label: 'Plătit',   color: 'bg-emerald-500', count: summary.paidCount,    amt: paidAmt },
                { label: 'Parțial',  color: 'bg-accent-400',  count: summary.partialCount, amt: partialAmt },
                { label: 'Neplătit', color: 'bg-amber-400',   count: summary.unpaidCount,  amt: unpaidAmt },
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
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                {pct(summary?.unpaidCount ?? 0)}%
              </span>
            </div>
            <p className="text-2xl font-extrabold text-amber-500 dark:text-amber-400">{unpaidAmt.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">MDL neplătit</p>
            <p className="text-xs text-slate-400 mt-1">{summary?.unpaidCount ?? 0} în așteptare</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
              <div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${pct(summary?.unpaidCount ?? 0)}%` }} />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Breakdown Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Analiză status</h3>
            </div>

            {/* Big ring SVG */}
            {summary && (() => {
              const R = 52, circ = 2 * Math.PI * R;
              const t = summaryTotal || 1;
              const arcs = [
                { count: summary.paidCount,    color: '#22c55e', label: 'Plătit'   },
                { count: summary.partialCount, color: '#a78bfa', label: 'Parțial'  },
                { count: summary.unpaidCount,  color: '#f59e0b', label: 'Neplătit' },
              ];
              let offset = 0;
              return (
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="relative w-36 h-36">
                    <svg viewBox="0 0 120 120" className="w-full h-full">
                      <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor"
                        strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
                      {arcs.map((arc, i) => {
                        const dash = (arc.count / t) * circ;
                        const el = (
                          <circle key={i} cx="60" cy="60" r={R} fill="none"
                            stroke={arc.color} strokeWidth="12"
                            strokeDasharray={`${dash.toFixed(2)} ${circ}`}
                            strokeLinecap="round"
                            style={{
                              transform: 'rotate(-90deg)', transformOrigin: 'center',
                              strokeDashoffset: `${-offset.toFixed(2)}`,
                              transition: 'stroke-dasharray 0.8s ease-out',
                              opacity: arc.count === 0 ? 0 : 1,
                            }}
                          />
                        );
                        offset += dash;
                        return el;
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{summary.paidPercentage}%</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wide">colectat</span>
                    </div>
                  </div>
                  {/* Per-status rows */}
                  <div className="w-full space-y-2.5">
                    {arcs.filter(a => a.count > 0 || a.label === 'Plătit').map(arc => (
                      <div key={arc.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: arc.color }} />
                            <span className="text-slate-600 dark:text-slate-300">{arc.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{arc.count}</span>
                            <span className="text-slate-400">{pct(arc.count)}%</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${pct(arc.count)}%`, background: arc.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Revenue summary */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Colectat</p>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{paidAmt.toLocaleString()} MDL</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Outstanding</p>
                <p className="text-sm font-extrabold text-red-500 mt-0.5">{(summary?.outstanding ?? 0).toLocaleString()} MDL</p>
              </div>
            </div>
          </div>

          {/* Right column: toolbar + cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Toolbar */}
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
              </div>
              {payments.length > 0 && (
                <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  {payments.length} plăți
                </span>
              )}
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Add payment card — always first */}
              <button
                onClick={() => { setEditPayment(null); setShowForm(true); }}
                className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] min-h-[160px] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/60 group-hover:scale-110 transition-all duration-200">
                  <Plus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Înregistrează plată</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Adaugă o nouă înregistrare</p>
                </div>
              </button>

              {sorted.map(payment => {
                const isPaid    = payment.status === 'paid';
                const isPartial = payment.status === 'partial';
                const borderColor =
                  isPaid    ? 'border-l-emerald-500' :
                  isPartial ? 'border-l-accent-400' :
                              'border-l-amber-400';
                const bgExtra = 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50';
                return (
                  <div key={payment.id}
                    className={`group relative rounded-2xl border border-slate-200 dark:border-slate-800 border-l-4 ${borderColor} ${bgExtra} p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:translate-y-[-1px]`}
                  >
                    {/* Top row: avatar + name + badge */}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        isPaid    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                        isPartial ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300' :
                                    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      }`}>
                        {(payment.student_name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate">{payment.student_name}</p>
                        <p className="text-xs text-slate-400 truncate">{(payment.instruments ?? []).join(', ')}</p>
                      </div>
                      <Badge variant={paymentBadge(payment.status)} className="flex-shrink-0">
                        {paymentLabel(payment.status)}
                      </Badge>
                    </div>

                    {/* Amount + period */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">{payment.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-0.5">MDL · {MONTHS[payment.month - 1]}</p>
                      </div>
                      <div className="text-right">
                        {payment.payment_date && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {isPaid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                            {payment.payment_date}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {!isPaid && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(payment)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">Plătit</span>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { setEditPayment(payment); setShowForm(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(payment)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <PaymentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => { mutate(); mutateRevenue(); }}
        payment={editPayment}
        showToast={toast}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge plată" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Șterge plata pentru <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.student_name}</strong>?
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
