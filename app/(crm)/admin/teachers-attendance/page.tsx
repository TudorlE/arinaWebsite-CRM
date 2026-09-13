'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, ClipboardList, Users } from 'lucide-react';
import Select from '@/components/ui/Select';
import PageBanner from '@/components/ui/PageBanner';
import { MonthlyStats, INSTRUMENTS } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function pad2(n: number) { return String(n).padStart(2, '0'); }

export default function TeachersAttendancePage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [fDiscipline, setFDiscipline] = useState('');

  const ref = new Date();
  ref.setDate(1);
  ref.setMonth(ref.getMonth() + monthOffset);
  const month = `${ref.getFullYear()}-${pad2(ref.getMonth() + 1)}`;
  const monthLabel = ref.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

  const params = new URLSearchParams({ month });
  if (fDiscipline) params.set('discipline', fDiscipline);

  const { data, isLoading } = useSWR(`/api/teachers/stats?${params.toString()}`, fetcher);
  const stats: MonthlyStats[] = data?.stats ?? [];

  return (
    <div className="flex flex-col flex-1">
      <PageBanner
        icon={ClipboardList}
        title="Profesori Frecvență"
        subtitle="Activitatea fiecărui profesor, calculată live din Program"
        accent="#AC2A88"
      />

      <main className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setMonthOffset(m => m - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize min-w-32 text-center">{monthLabel}</span>
            <button onClick={() => setMonthOffset(m => Math.min(m + 1, 0))} disabled={monthOffset >= 0} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="w-40"><Select value={fDiscipline} onChange={e => setFDiscipline(e.target.value)} placeholder="Disciplină" options={INSTRUMENTS.map(i => ({ value: i, label: i }))} /></div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Se încarcă…</div>
        ) : stats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Nicio lecție în luna selectată</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stats.map(t => (
              <div key={t.teacher_id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{t.teacher_name}</p>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{t.total}</p>
                    <p className="text-[10px] text-slate-400">Total așteptat</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{t.completed}</p>
                    <p className="text-[10px] text-slate-400">Finalizate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-accent-600 dark:text-accent-400">{t.recovered}</p>
                    <p className="text-[10px] text-slate-400">Recuperate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{t.excused_absence}</p>
                    <p className="text-[10px] text-slate-400">Motivate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-red-600 dark:text-red-400">{t.unexcused_absence}</p>
                    <p className="text-[10px] text-slate-400">Nemotivate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-violet-600 dark:text-violet-400">{t.replaced ?? 0}</p>
                    <p className="text-[10px] text-slate-400">Înlocuite</p>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <Users className="w-3.5 h-3.5" /> Elevi ({(t.students ?? []).length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(t.students ?? []).map(name => (
                      <span key={name} className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">{name}</span>
                    ))}
                    {(t.students ?? []).length === 0 && <span className="text-xs text-slate-400">Niciun elev luna asta</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
