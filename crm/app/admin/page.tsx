'use client';

import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { useRouter } from 'next/navigation';
import {
  Users, DollarSign, Calendar, AlertCircle,
  TrendingUp, TrendingDown,
  Clock, LayoutDashboard, ChevronRight,
  Banknote, Flame,
} from 'lucide-react';
import { DashboardStats, MONTHS, Payment } from '@/lib/types';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

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

const fetcher = (url: string) => fetch(url).then(r => r.json());

function StatCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: { value: number; label: string };
}) {
  const up = trend && trend.value >= 0;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            up ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
               : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

/* ── Payment Status Card ──────────────────────────────────── */
function PaymentStatusCard({
  summary, payments, router, now,
}: {
  summary: RevenueSummary | undefined;
  payments: Payment[];
  router: ReturnType<typeof useRouter>;
  now: Date;
}) {
  const rate  = summary?.paidPercentage ?? 0;
  const R     = 40;
  const circ  = 2 * Math.PI * R;
  const total = (summary?.paidCount ?? 0) + (summary?.unpaidCount ?? 0)
              + (summary?.partialCount ?? 0);

  const pct = (n: number) => total > 0 ? `${((n / total) * 100).toFixed(0)}%` : '0%';

  const rows = [
    { label: 'Plătit',   count: summary?.paidCount    ?? 0, bar: 'bg-emerald-500', amt: summary?.monthRevenue ?? 0 },
    { label: 'Neplătit', count: summary?.unpaidCount  ?? 0, bar: 'bg-amber-400',   amt: null },
    { label: 'Parțial',  count: summary?.partialCount ?? 0, bar: 'bg-purple-400',  amt: null },
  ];

  void payments;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Status plăți</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{MONTHS[now.getMonth()]} {now.getFullYear()}</p>
        </div>
        <button
          onClick={() => router.push('/payments')}
          className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
        >
          Detalii <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* SVG ring + status bars */}
      <div className="flex items-center gap-4">
        {/* Donut ring */}
        <div className="relative flex-shrink-0 w-24 h-24">
          <svg viewBox="0 0 90 90" className="w-full h-full">
            {/* Track */}
            <circle cx="45" cy="45" r={R} fill="none" stroke="currentColor"
              strokeWidth="9" className="text-slate-100 dark:text-slate-800"
            />
            {/* Paid arc */}
            <circle cx="45" cy="45" r={R} fill="none" stroke="#22c55e" strokeWidth="9"
              strokeDasharray={`${((rate / 100) * circ).toFixed(2)} ${circ}`}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center',
                transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">{rate}%</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wide mt-0.5">colectat</span>
          </div>
        </div>

        {/* Status rows */}
        <div className="flex-1 flex flex-col gap-2">
          {rows.filter(r => r.count > 0 || r.label === 'Plătit').map(row => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{row.count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${row.bar} transition-all duration-700 ease-out`}
                  style={{ width: pct(row.count) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue pills */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Colectat</p>
          </div>
          <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
            {(summary?.monthRevenue ?? 0).toLocaleString()} MDL
          </p>
        </div>
        <div className={`rounded-xl p-3 ${
          (summary?.unpaidCount ?? 0) > 0
            ? 'bg-amber-50 dark:bg-amber-900/20'
            : 'bg-slate-50 dark:bg-slate-800'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            {(summary?.unpaidCount ?? 0) > 0
              ? <Flame className="w-3.5 h-3.5 text-amber-500" />
              : <Clock className="w-3.5 h-3.5 text-slate-400" />
            }
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Neplătit</p>
          </div>
          <p className={`text-base font-extrabold ${
            (summary?.unpaidCount ?? 0) > 0 ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300'
          }`}>
            {(summary?.outstanding ?? 0).toLocaleString()} MDL
          </p>
        </div>
      </div>
    </div>
  );
}

const INSTRUMENT_COLORS: Record<string, string> = {
  'Piano':          'bg-indigo-500',
  'Chitară':        'bg-amber-500',
  'Tobe':           'bg-red-500',
  'Canto':          'bg-pink-500',
  'Teoria muzicii': 'bg-teal-500',
  'Solfegiu':       'bg-cyan-500',
};

function UpcomingLessonRow({ lesson, index }: {
  lesson: { id: number; student_name: string; teacher_name: string; date: string; time: string; duration: number; status: string; instrument?: string };
  index: number;
}) {
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const isToday    = lesson.date === today;
  const isTomorrow = lesson.date === tomorrow;

  const dayLabel = isToday ? 'Azi' : isTomorrow ? 'Mâine' : lesson.date;
  const dayColor = isToday
    ? 'bg-indigo-500 text-white'
    : isTomorrow
    ? 'bg-amber-400 text-white'
    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

  const initials = (lesson.student_name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarColors = ['bg-indigo-500','bg-violet-500','bg-emerald-500','bg-sky-500','bg-pink-500','bg-amber-500'];
  const avatarColor  = avatarColors[index % avatarColors.length];

  return (
    <div className={`group flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
      isToday ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
    }`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-xl ${avatarColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <span className="text-xs font-extrabold text-white tracking-wide">{initials}</span>
      </div>

      {/* Name + teacher */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{lesson.student_name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">cu <span className="font-medium">{lesson.teacher_name}</span></p>
      </div>

      {/* Time pill */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 flex-shrink-0">
        <Clock className="w-3 h-3 text-slate-400" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{lesson.time}</span>
      </div>

      {/* Duration badge */}
      <span className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex-shrink-0">
        {lesson.duration}min
      </span>

      {/* Day label */}
      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${dayColor}`}>
        {dayLabel}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const now = new Date();
  const { data } = useSWR<{ stats: DashboardStats }>('/api/stats', fetcher, { refreshInterval: 30000 });
  const { data: lessonsData } = useSWR('/api/lessons?status=scheduled', fetcher);
  const { data: paymentsData } = useSWRImmutable('/api/payments', fetcher);

  const { data: revData } = useSWR<{ summary: RevenueSummary }>('/api/payments/revenue', fetcher, { refreshInterval: 60_000 });
  const revSummary = revData?.summary;

  const stats = data?.stats;
  const upcomingLessons: {
    id: number; student_name: string; teacher_name: string;
    date: string; time: string; duration: number; status: string;
  }[] = lessonsData?.lessons?.slice(0, 8) ?? [];

  const allPaymentsArr: Payment[] = paymentsData?.payments ?? [];

  // Area chart — last 6 months income
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const income = (paymentsData?.payments ?? [])
      .filter((p: { month: number; year: number; status: string; amount: number }) =>
        p.month === m && p.year === y && p.status === 'paid')
      .reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
    return { name: MONTHS[m - 1].slice(0, 3), income };
  });

  return (
    <div className="flex flex-col flex-1">
      {/* ── Page Banner ──────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden', padding: '22px 32px',
        background: 'linear-gradient(135deg, #0f0820 0%, #1a0d38 55%, #0d1a2e 100%)',
        borderBottom: '1px solid rgba(201,160,32,0.18)',
      }}>
        <div style={{ position: 'absolute', top: -30, left: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(201,160,32,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(109,40,217,0.1)', filter: 'blur(48px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: '10px', background: 'rgba(201,160,32,0.15)', borderRadius: 16, border: '1px solid rgba(201,160,32,0.3)' }}>
            <LayoutDashboard style={{ width: 26, height: 26, color: '#c9a020' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Panou general</h1>
            <p style={{ color: 'rgba(201,160,32,0.7)', fontSize: 13, fontWeight: 500, margin: '3px 0 0' }}>{MONTHS[now.getMonth()]} {now.getFullYear()} — privire de ansamblu</p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* ── Stats cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Elevi înscriși" value={stats?.totalStudents ?? '—'} icon={Users} color="bg-indigo-500" sub="Elevi activi" trend={{ value: 12, label: 'față de luna trecută' }} />
          <StatCard label="Venituri lunare" value={stats ? `${stats.totalMonthlyIncome.toLocaleString()} MDL` : '—'} icon={DollarSign} color="bg-emerald-500" sub={`${stats?.paidThisMonth?.toLocaleString() ?? 0} MDL colectate`} trend={{ value: 8, label: 'față de luna trecută' }} />
          <StatCard label="Lecții azi" value={stats?.upcomingLessonsToday ?? '—'} icon={Calendar} color="bg-blue-500" sub="Programate" trend={{ value: 0, label: '' }} />
          <StatCard label="Neachitate luna aceasta" value={stats?.unpaidCount ?? '—'} icon={AlertCircle} color="bg-amber-500" sub={`${stats?.pendingPayments ?? 0} în total în așteptare`} trend={{ value: -5, label: 'față de luna trecută' }} />
        </div>

        {/* ── Charts row ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Area chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Prezentare venituri</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Plăți încasate — ultimele 6 luni</p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 13, padding: '10px 14px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: '#a5b4fc', fontWeight: 700 }}
                  formatter={(v) => [`${Number(v).toLocaleString()} MDL`, 'Venituri']}
                />
                <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={2} fill="url(#incomeGrad)" dot={{ fill: '#6366f1', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Advanced Payment Status */}
          <PaymentStatusCard summary={revSummary} payments={allPaymentsArr} router={router} now={now} />
        </div>

        {/* ── Upcoming Lessons (full width) ────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Lecții viitoare</h2>
              <p className="text-xs text-slate-400">{upcomingLessons.length} programate</p>
            </div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcomingLessons.length > 0
              ? upcomingLessons.map((l, i) => <UpcomingLessonRow key={l.id} lesson={l} index={i} />)
              : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-400">Nicio lecție viitoare programată</p>
                </div>
              )
            }
          </div>
        </div>

      </main>
    </div>
  );
}

