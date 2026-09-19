'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { CalendarRange } from 'lucide-react';
import { RecurringSchedule, Cabinet, CabinetDayStatus } from '@/lib/types';
import PageBanner from '@/components/ui/PageBanner';
import { DEFAULT_TIME_SLOTS } from '@/lib/timeSlots';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Same day-by-day cabinet table as Program Privat, but strictly read-only —
// this page mirrors the fixed weekly schedule for staff to see, not to
// change; it has no concept of week/month/year, same as Program Privat.
const DEFAULT_SLOTS = DEFAULT_TIME_SLOTS;
const DAY_LABELS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

function todayDayIdx(): number {
  const d = new Date().getDay(); // Sun=0..Sat=6
  return d === 0 ? 6 : d - 1; // Mon=0..Sun=6, matches DAY_LABELS
}

/** DAY_LABELS index (Luni-first) -> DB day_of_week (0=Duminică..6=Sâmbătă). */
function dowForIdx(idx: number): number {
  return (idx + 1) % 7;
}

export default function GeneralSchedulePage() {
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayDayIdx());
  const selectedDow = dowForIdx(selectedDayIdx);

  const { data: allData } = useSWR('/api/recurring-schedules?active=true', fetcher);
  const allSchedules: RecurringSchedule[] = allData?.schedules ?? [];
  const { data: cabinetsData } = useSWR('/api/cabinets', fetcher);
  const cabinets: Cabinet[] = cabinetsData?.cabinets ?? [];
  const dayStatuses: CabinetDayStatus[] = cabinetsData?.dayStatuses ?? [];

  const daySchedules = allSchedules.filter(s => s.day_of_week === selectedDow);

  const byCabinetTime: Record<string, RecurringSchedule[]> = {};
  for (const s of daySchedules) {
    const cid = s.cabinet_id ?? 'none';
    const t = (s.start_time ?? '').slice(0, 5);
    const key = `${cid}|${t}`;
    (byCabinetTime[key] ??= []).push(s);
  }
  const extraSlots = Array.from(new Set(daySchedules.map(s => (s.start_time ?? '').slice(0, 5))))
    .filter(t => t && !DEFAULT_SLOTS.includes(t));
  const timeSlots = [...DEFAULT_SLOTS, ...extraSlots].sort();
  const hasUnassigned = daySchedules.some(s => s.cabinet_id == null);
  const cabinetColumns: { id: number | 'none'; name: string }[] = [
    ...cabinets,
    ...(hasUnassigned ? [{ id: 'none' as const, name: 'Fără cabinet' }] : []),
  ];
  const dayStatusFor = (cabinetId: number): 'liber' | 'ocupat' =>
    dayStatuses.find(s => s.cabinet_id === cabinetId && s.day_of_week === selectedDow)?.status ?? 'liber';

  return (
    <div className="flex flex-col flex-1">
      {/* ── Banner ────────────────────────────────────────── */}
      <PageBanner
        icon={CalendarRange}
        title="Program General"
        subtitle="Orarul fix al elevilor — doar citire"
        accent="#5934DC"
      />

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
        <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
          {/* Day tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
            {DAY_LABELS.map((label, i) => {
              const isToday = i === todayDayIdx();
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
                </thead>
                <tbody>
                  {timeSlots.map(time => (
                    <tr key={time}>
                      <td className="border border-gray-200 px-4 py-5 text-base font-mono font-semibold text-gray-700 bg-gray-50 whitespace-nowrap">
                        {time}
                      </td>
                      {cabinetColumns.map(col => {
                        const key = `${col.id}|${time}`;
                        const cellSchedules = byCabinetTime[key] ?? [];
                        return (
                          <td
                            key={col.id}
                            className="relative border border-gray-200 px-2.5 py-2.5 align-top min-w-[180px] min-h-[64px]"
                          >
                            {cellSchedules.map(s => (
                              <div
                                key={s.id}
                                className="relative text-sm px-3 py-2.5 rounded-lg border mb-1 last:mb-0 select-none bg-brand-50 border-brand-300 text-brand-800"
                              >
                                <p className="font-semibold truncate">{s.student_name}</p>
                                <p className="truncate text-xs mt-0.5">
                                  <span className="font-semibold" style={{ color: 'inherit' }}>{s.discipline || '—'}</span>
                                  <span className="opacity-70"> · {s.teacher_name}</span>
                                </p>
                              </div>
                            ))}
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
          <span>Orar fix — se repetă în fiecare săptămână.</span>
          <span className="ml-auto text-[11px] opacity-50 italic">Mod vizualizare</span>
        </div>
      </main>
    </div>
  );
}
