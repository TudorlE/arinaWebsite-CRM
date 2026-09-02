'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MonthlyStats } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function pad2(n: number) { return String(n).padStart(2, '0'); }

const TILES: { key: keyof MonthlyStats; label: string; color: string }[] = [
  { key: 'total',             label: 'Total lecții',        color: 'text-slate-700 dark:text-slate-200' },
  { key: 'scheduled',         label: 'Programate',          color: 'text-brand-600 dark:text-brand-400' },
  { key: 'completed',         label: 'Finalizate',          color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'cancelled',         label: 'Anulate',              color: 'text-slate-500 dark:text-slate-400' },
  { key: 'recovered',         label: 'Recuperate',          color: 'text-accent-600 dark:text-accent-400' },
  { key: 'present',           label: 'Prezențe',            color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'excused_absence',   label: 'Absențe motivate',    color: 'text-amber-600 dark:text-amber-400' },
  { key: 'unexcused_absence', label: 'Absențe nemotivate',  color: 'text-red-600 dark:text-red-400' },
];

export default function StudentMonthlyStats({ studentId }: { studentId: number }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const ref = new Date();
  ref.setDate(1);
  ref.setMonth(ref.getMonth() + monthOffset);
  const month = `${ref.getFullYear()}-${pad2(ref.getMonth() + 1)}`;
  const monthLabel = ref.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

  const { data, isLoading } = useSWR(`/api/students/stats?student_id=${studentId}&month=${month}`, fetcher);
  const stats: MonthlyStats | undefined = data?.stats?.[0];

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonthOffset(m => m - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{monthLabel}</p>
        <button onClick={() => setMonthOffset(m => Math.min(m + 1, 0))} disabled={monthOffset >= 0} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30">
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-6">Se încarcă…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TILES.map(t => (
            <div key={t.key} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 text-center">
              <p className={`text-2xl font-extrabold ${t.color}`}>{stats ? (stats[t.key] as number ?? 0) : 0}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
