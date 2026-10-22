'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { useRouter } from 'next/navigation';
import {
  Users, Music2, BookCheck,
  TrendingUp, TrendingDown,
  LayoutDashboard, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { DashboardStats, MONTHS } from '@/lib/types';
import AccessDenied from '@/components/AccessDenied';
import { BirthdayTodayBanner, UpcomingBirthdaysCard } from '@/components/dashboard/Birthdays';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const fetcher = (url: string) => fetch(url).then(r => r.json());

/** % change from `prev` to `cur`, rounded — null when there's nothing to compare against. */
function trendPct(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? null : 100;
  return Math.round(((cur - prev) / prev) * 100);
}

function StatCard({
  label, value, sub, icon: Icon, color, glow, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; glow: string; trend?: number | null;
}) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10" style={{ background: glow, filter: 'blur(28px)' }} />
      <div className="relative flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${color}`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-xs font-bold px-2.5 py-1 rounded-full ${
            up ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
               : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="relative text-4xl font-extrabold text-slate-900 dark:text-white leading-none">{value}</p>
      <p className="relative text-base font-semibold text-slate-600 dark:text-slate-300 mt-2">{label}</p>
      {sub && <p className="relative text-xs text-slate-400 dark:text-slate-500 mt-1.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const today = new Date();
  const [selMonth, setSelMonth] = useState(today.getMonth() + 1); // 1-12
  const [selYear, setSelYear]   = useState(today.getFullYear());
  const now = new Date(selYear, selMonth - 1, 1);
  const [role, setRole] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => setRole(null));
  }, []);

  const goMonth = (delta: number) => {
    const d = new Date(selYear, selMonth - 1 + delta, 1);
    setSelMonth(d.getMonth() + 1);
    setSelYear(d.getFullYear());
  };
  const isCurrentMonth = selMonth === today.getMonth() + 1 && selYear === today.getFullYear();

  const { data } = useSWR<{ stats: DashboardStats }>(`/api/stats?month=${selMonth}&year=${selYear}`, fetcher, { refreshInterval: 30000 });
  const stats = data?.stats;

  // Previous month's stats — for real (not made-up) trend percentages.
  const prevRef = new Date(selYear, selMonth - 2, 1);
  const { data: prevData } = useSWR<{ stats: DashboardStats }>(`/api/stats?month=${prevRef.getMonth() + 1}&year=${prevRef.getFullYear()}`, fetcher);
  const prevStats = prevData?.stats;

  const { data: paymentsData } = useSWRImmutable('/api/payments', fetcher);

  // Area chart — 6 months ending at the selected month
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(selYear, selMonth - 1 - (5 - i), 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const income = (paymentsData?.payments ?? [])
      .filter((p: { month: number; year: number; status: string; amount: number }) =>
        p.month === m && p.year === y && p.status === 'paid')
      .reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
    return { name: MONTHS[m - 1].slice(0, 3), income };
  });

  if (role === 'administrator') return <AccessDenied title="Dashboard" />;

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 max-w-full">
      {/* ── Page Banner — icon/title/subtitle hidden on phone/tablet, same
            as every other page's PageBanner; the month switcher (the actual
            control, not decoration) stays visible everywhere. ── */}
      <div className="relative overflow-hidden py-3 sm:py-5 lg:py-6 px-5 sm:px-8" style={{
        background: 'linear-gradient(135deg, #0f0820 0%, #1a0d38 55%, #0d1a2e 100%)',
        borderBottom: '1px solid rgba(201,160,32,0.18)',
      }}>
        <div className="hidden lg:block" style={{ position: 'absolute', top: -30, left: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(201,160,32,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div className="hidden lg:block" style={{ position: 'absolute', bottom: -20, right: 60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(109,40,217,0.1)', filter: 'blur(48px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 16 }}>
            <div style={{ padding: '10px', background: 'rgba(201,160,32,0.15)', borderRadius: 16, border: '1px solid rgba(201,160,32,0.3)' }}>
              <LayoutDashboard style={{ width: 26, height: 26, color: '#c9a020' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Panou general</h1>
              <p style={{ color: 'rgba(201,160,32,0.7)', fontSize: 13, fontWeight: 500, margin: '3px 0 0' }}>{MONTHS[now.getMonth()]} {now.getFullYear()} — privire de ansamblu</p>
            </div>
          </div>

          {/* Month switcher */}
          <div className="ml-auto lg:ml-0" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,160,32,0.25)', borderRadius: 12, padding: 4 }}>
            <button
              onClick={() => goMonth(-1)}
              aria-label="Luna anterioară"
              style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, border: 'none', background: 'transparent', color: '#e2d5a8', cursor: 'pointer' }}
              className="hover:bg-white/10"
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 130, textAlign: 'center' }}>
              {MONTHS[selMonth - 1]} {selYear}
            </span>
            <button
              onClick={() => goMonth(1)}
              aria-label="Luna următoare"
              style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, border: 'none', background: 'transparent', color: '#e2d5a8', cursor: 'pointer' }}
              className="hover:bg-white/10"
            >
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
            {!isCurrentMonth && (
              <button
                onClick={() => { setSelMonth(today.getMonth() + 1); setSelYear(today.getFullYear()); }}
                style={{ fontSize: 11, fontWeight: 700, color: '#c9a020', background: 'rgba(201,160,32,0.15)', border: '1px solid rgba(201,160,32,0.3)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', marginLeft: 2 }}
              >
                Azi
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 min-h-0 p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto overflow-x-hidden">

        {/* ── Birthday today (only shows when someone has one) ── */}
        <BirthdayTodayBanner />

        {/* ── Stats cards — all real numbers, real month-over-month trends ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            label="Elevi înscriși" value={stats?.totalStudents ?? '—'} icon={Users} color="bg-brand-500" glow="#6d4cea" sub="Elevi activi"
            trend={stats && prevStats ? trendPct(stats.totalStudents, prevStats.totalStudents) : null}
          />
          <StatCard
            label="Profesori" value={stats?.totalTeachers ?? '—'} icon={Music2} color="bg-violet-500" glow="#8b5cf6" sub="Activi în școală"
            trend={stats && prevStats ? trendPct(stats.totalTeachers, prevStats.totalTeachers) : null}
          />
          <StatCard
            label="Lecții finalizate" value={stats?.completedLessonsThisMonth ?? '—'} icon={BookCheck} color="bg-sky-500" glow="#0ea5e9" sub={`${MONTHS[selMonth - 1]}`}
            trend={stats && prevStats ? trendPct(stats.completedLessonsThisMonth, prevStats.completedLessonsThisMonth) : null}
          />
        </div>

        {/* ── Revenue overview + Birthdays ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

          {/* Area chart */}
          <div className="lg:col-span-2 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Prezentare venituri</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Plăți încasate — ultimele 6 luni</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <ResponsiveContainer width="100%" height={320}>
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
            <button
              onClick={() => router.push('/admin/payments')}
              className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors mt-3"
            >
              Vezi detalii plăți <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <UpcomingBirthdaysCard />
        </div>

      </main>
    </div>
  );
}
