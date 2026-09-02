'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { CalendarRange } from 'lucide-react';
import { Lesson, Cabinet, CabinetDayStatus } from '@/lib/types';
import { DEFAULT_TIME_SLOTS } from '@/lib/timeSlots';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Same day-by-day cabinet table as Program Privat, but strictly read-only —
// this page is for staff to see the schedule, not to change it.
const DEFAULT_SLOTS = DEFAULT_TIME_SLOTS;
const DAY_LABELS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

function todayDayIdx(): number {
  const d = new Date().getDay(); // Sun=0..Sat=6
  return d === 0 ? 6 : d - 1; // Mon=0..Sun=6, matches getWeekDates()
}

function getWeekDates(ref: Date): Date[] {
  const day = ref.getDay();
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - day + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtDate(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function GeneralSchedulePage() {
  const reference = new Date();
  const weekDates = getWeekDates(reference);
  const todayStr = fmtDate(new Date());

  const [selectedDayIdx, setSelectedDayIdx] = useState(todayDayIdx());

  const { data: allData } = useSWR('/api/lessons', fetcher);
  const allLessons: Lesson[] = allData?.lessons ?? [];
  const { data: cabinetsData } = useSWR('/api/cabinets', fetcher);
  const cabinets: Cabinet[] = cabinetsData?.cabinets ?? [];
  const assignments: { id: number; cabinet_id: number; day_of_week: number; teacher_id: number | null; teacher_name?: string | null }[] = cabinetsData?.assignments ?? [];
  const dayStatuses: CabinetDayStatus[] = cabinetsData?.dayStatuses ?? [];

  const selectedDate = fmtDate(weekDates[selectedDayIdx]);
  const dayLessons = allLessons.filter(l => l.date === selectedDate);

  const byCabinetTime: Record<string, Lesson[]> = {};
  for (const l of dayLessons) {
    const cid = l.cabinet_id ?? 'none';
    const t = (l.time ?? '').slice(0, 5);
    const key = `${cid}|${t}`;
    (byCabinetTime[key] ??= []).push(l);
  }
  const extraSlots = Array.from(new Set(dayLessons.map(l => (l.time ?? '').slice(0, 5))))
    .filter(t => t && !DEFAULT_SLOTS.includes(t));
  const timeSlots = [...DEFAULT_SLOTS, ...extraSlots].sort();
  const hasUnassigned = dayLessons.some(l => l.cabinet_id == null);
  const cabinetColumns: { id: number | 'none'; name: string }[] = [
    ...cabinets,
    ...(hasUnassigned ? [{ id: 'none' as const, name: 'Fără cabinet' }] : []),
  ];
  const selectedDow = weekDates[selectedDayIdx].getDay();
  const assignmentFor = (cabinetId: number) => assignments.find(a => a.cabinet_id === cabinetId && a.day_of_week === selectedDow);
  const dayStatusFor = (cabinetId: number): 'liber' | 'ocupat' =>
    dayStatuses.find(s => s.cabinet_id === cabinetId && s.day_of_week === selectedDow)?.status ?? 'liber';

  return (
    <div className="flex flex-col flex-1">
      {/* ── Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-600 to-accent-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <CalendarRange className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Program General</h1>
            <p className="text-brand-200 text-sm font-medium mt-0.5">Vizualizează programul — doar citire</p>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
        <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
          {/* Day tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
            {DAY_LABELS.map((label, i) => {
              const d = weekDates[i];
              const isToday = fmtDate(d) === todayStr;
              const isSelected = i === selectedDayIdx;
              return (
                <button
                  key={label}
                  onClick={() => setSelectedDayIdx(i)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors duration-150
                    ${isSelected ? 'bg-brand-600 text-white shadow-sm' : isToday ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Cabinet table — Ora | Cabinet 1 | Cabinet 2 | Cabinet 3 (read-only) */}
          <div className="flex-1 overflow-auto p-4">
            {cabinetColumns.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-sm font-semibold text-slate-500">Nu există cabinete configurate</p>
              </div>
            ) : (
              <table className="w-full border-collapse bg-white" style={{ minWidth: 560 }}>
                <thead>
                  <tr className="bg-brand-50">
                    <th className="border border-brand-100 px-4 py-4 text-sm font-bold uppercase tracking-wider text-brand-700 text-left w-24">Ora</th>
                    {cabinetColumns.map(col => {
                      const status = typeof col.id === 'number' ? dayStatusFor(col.id) : null;
                      const label = col.id === 'none' ? col.name : /cabinet/i.test(col.name) ? col.name : `Cabinet ${col.name}`;
                      return (
                        <th key={col.id} className="border border-brand-100 px-4 py-4 text-sm font-bold uppercase tracking-wider text-brand-700 text-left align-top">
                          <div className="flex flex-col gap-1.5">
                            <span>{label}</span>
                            {status === 'ocupat' && (
                              <span className="self-start text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full normal-case bg-red-100 text-red-700">
                                Ocupat
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                  <tr className="bg-brand-50/60">
                    <th className="border border-brand-100 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-brand-400 text-left">Profesor</th>
                    {cabinetColumns.map(col => (
                      <th key={col.id} className="border border-brand-100 px-2 py-2.5 font-normal">
                        {typeof col.id === 'number' ? (
                          <span className="block text-sm font-semibold text-gray-700 px-2 py-1.5">
                            {assignmentFor(col.id)?.teacher_name ?? '— fără profesor —'}
                          </span>
                        ) : <span className="block text-center text-xs text-gray-300">—</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => (
                    <tr key={time}>
                      <td className="border border-gray-200 px-4 py-5 text-base font-mono font-semibold text-gray-700 bg-gray-50 whitespace-nowrap">
                        {time}
                      </td>
                      {cabinetColumns.map(col => {
                        const key = `${col.id}|${time}`;
                        const cellLessons = byCabinetTime[key] ?? [];
                        return (
                          <td
                            key={col.id}
                            className="relative border border-gray-200 px-2.5 py-2.5 align-top min-w-[180px] min-h-[64px]"
                          >
                            {cellLessons.map(l => {
                              const statusStyle =
                                l.status === 'completed' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                                l.status === 'cancelled' ? 'bg-gray-100 border-gray-300 text-gray-400 line-through' :
                                'bg-brand-50 border-brand-300 text-brand-800';
                              return (
                                <div
                                  key={l.id}
                                  className={`relative text-sm px-3 py-2.5 rounded-lg border mb-1 last:mb-0 select-none ${statusStyle}`}
                                >
                                  <p className="font-semibold truncate">{l.student_name}</p>
                                  <p className="truncate text-xs mt-0.5">
                                    <span className="font-semibold" style={{ color: 'inherit' }}>{l.discipline || '—'}</span>
                                    <span className="opacity-70"> · {l.teacher_name}</span>
                                  </p>
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Legend ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pb-1">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-brand-500" />Programat</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500" />Finalizat</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-slate-400" />Anulat</span>
          <span className="ml-auto text-[11px] opacity-50 italic">Mod vizualizare</span>
        </div>
      </main>
    </div>
  );
}
