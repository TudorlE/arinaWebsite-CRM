'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import Select from '@/components/ui/Select';
import { MonthlyStats, INSTRUMENTS } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function pad2(n: number) { return String(n).padStart(2, '0'); }

export default function StudentsAttendancePage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [fTeacher, setFTeacher] = useState('');
  const [fDiscipline, setFDiscipline] = useState('');

  const ref = new Date();
  ref.setDate(1);
  ref.setMonth(ref.getMonth() + monthOffset);
  const month = `${ref.getFullYear()}-${pad2(ref.getMonth() + 1)}`;
  const monthLabel = ref.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

  const { data: teachersData } = useSWR('/api/teachers', fetcher);

  const params = new URLSearchParams({ month });
  if (fTeacher) params.set('teacher_id', fTeacher);
  if (fDiscipline) params.set('discipline', fDiscipline);

  const { data, isLoading } = useSWR(`/api/students/stats?${params.toString()}`, fetcher);
  const stats: MonthlyStats[] = data?.stats ?? [];
  const teachers = teachersData?.teachers ?? [];

  return (
    <div className="flex flex-col flex-1">
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><ClipboardList className="w-7 h-7 text-white" /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Elevi Frecvență</h1>
            <p className="text-orange-100 text-sm font-medium mt-0.5">Frecvența tuturor elevilor, calculată live din Program</p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setMonthOffset(m => m - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize min-w-32 text-center">{monthLabel}</span>
            <button onClick={() => setMonthOffset(m => Math.min(m + 1, 0))} disabled={monthOffset >= 0} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="w-40"><Select value={fTeacher} onChange={e => setFTeacher(e.target.value)} placeholder="Profesor" options={teachers.map((t: { id: number; name: string }) => ({ value: t.id, label: t.name }))} /></div>
          <div className="w-40"><Select value={fDiscipline} onChange={e => setFDiscipline(e.target.value)} placeholder="Disciplină" options={INSTRUMENTS.map(i => ({ value: i, label: i }))} /></div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Elev</th>
                  <th className="px-4 py-3">Profesor</th>
                  <th className="px-3 py-3 text-center">Total</th>
                  <th className="px-3 py-3 text-center">Programate</th>
                  <th className="px-3 py-3 text-center">Finalizate</th>
                  <th className="px-3 py-3 text-center">Anulate</th>
                  <th className="px-3 py-3 text-center">Recuperate</th>
                  <th className="px-3 py-3 text-center">Prezențe</th>
                  <th className="px-3 py-3 text-center">Abs. mot.</th>
                  <th className="px-3 py-3 text-center">Abs. nemot.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan={10} className="text-center py-10 text-slate-400">Se încarcă…</td></tr>
                ) : stats.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-10 text-slate-400">Nicio lecție în luna selectată</td></tr>
                ) : stats.map(s => (
                  <tr key={s.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{s.student_name}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{s.teacher_name}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-800 dark:text-slate-100">{s.total}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-brand-600 dark:text-brand-400">{s.scheduled}</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400">{s.completed}</td>
                    <td className="px-3 py-2.5 text-center text-slate-500">{s.cancelled}</td>
                    <td className="px-3 py-2.5 text-center text-accent-600 dark:text-accent-400">{s.recovered}</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400">{s.present}</td>
                    <td className="px-3 py-2.5 text-center text-amber-600 dark:text-amber-400">{s.excused_absence}</td>
                    <td className="px-3 py-2.5 text-center text-red-600 dark:text-red-400">{s.unexcused_absence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
