'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { CalendarRange, Clock, MapPin, Users2 } from 'lucide-react';
import { RecurringSchedule, Cabinet, CabinetDayStatus, SOLFEGIU_GROUPS, SOLFEGIU_GROUP_COLORS } from '@/lib/types';
import PageBanner from '@/components/ui/PageBanner';
import { timeSlotsForDay } from '@/lib/timeSlots';
import { todayChisinau, nowHHMMChisinau } from '@/lib/dates';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const SOLFEGIU = 'Solfegiu și teoria muzicii';

// Same day-by-day cabinet table as Program Privat, but strictly read-only —
// this page mirrors the fixed weekly schedule for staff to see, not to
// change; it has no concept of week/month/year, same as Program Privat.
const DAY_LABELS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
const DAY_SHORT  = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];

function todayDayIdx(): number {
  // Moldova's date, not the server's (UTC on Vercel) — otherwise "today" can
  // land on the wrong tab for a few hours around midnight.
  const [y, m, d] = todayChisinau().split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay(); // Sun=0..Sat=6
  return day === 0 ? 6 : day - 1; // Mon=0..Sun=6, matches DAY_LABELS
}

/** DAY_LABELS index (Luni-first) -> DB day_of_week (0=Duminică..6=Sâmbătă). */
function dowForIdx(idx: number): number {
  return (idx + 1) % 7;
}

/** A lesson slot "spans" from this time until the next slot (45min default). */
function isCurrentSlot(time: string, next: string | undefined, isToday: boolean): boolean {
  if (!isToday) return false;
  const now = nowHHMMChisinau();
  return now >= time && (next ? now < next : true);
}

/** A soft, readable tint of the cabinet's own color — used as the lesson card's left accent + badge. */
function cabinetAccent(color?: string | null): string {
  return color || '#5934DC';
}

/** A Solfegiu group schedule has no single student — show the group's label instead. */
function displayName(s: { student_name?: string; group_name?: 'mica' | 'medie' | 'mare' | null }): string {
  if (s.group_name) return SOLFEGIU_GROUPS.find(g => g.value === s.group_name)?.label ?? s.group_name;
  return s.student_name ?? '—';
}

function LessonBlock({ s, accentColor }: { s: RecurringSchedule; accentColor: string }) {
  const groupColor = s.group_name ? SOLFEGIU_GROUP_COLORS[s.group_name] : null;
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 shadow-sm hover:shadow-md transition-shadow ${groupColor ? groupColor.block : 'bg-white dark:bg-slate-900'}`}
      style={groupColor ? undefined : { borderLeftWidth: 3, borderLeftColor: accentColor, borderTopColor: 'rgb(226 232 240)', borderRightColor: 'rgb(226 232 240)', borderBottomColor: 'rgb(226 232 240)' }}
    >
      <p className={`font-semibold text-[11px] sm:text-sm truncate ${groupColor ? '' : 'text-slate-800 dark:text-slate-100'}`}>{displayName(s)}</p>
      <p className={`truncate text-[9px] sm:text-xs mt-0.5 ${groupColor ? 'opacity-80' : 'text-slate-500 dark:text-slate-400'}`}>
        <span className="font-medium" style={groupColor ? undefined : { color: accentColor }}>{s.discipline || '—'}</span>
        <span className="opacity-70"> · {s.teacher_name}</span>
      </p>
    </div>
  );
}

export default function GeneralScheduleClient({ role }: { role: string | null }) {
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayDayIdx());
  const selectedDow = dowForIdx(selectedDayIdx);
  const isToday = selectedDayIdx === todayDayIdx();

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
  const daySlots = timeSlotsForDay(selectedDow);
  const extraSlots = Array.from(new Set(daySchedules.map(s => (s.start_time ?? '').slice(0, 5))))
    .filter(t => t && !daySlots.includes(t));
  const timeSlots = [...daySlots, ...extraSlots].sort();
  const hasUnassigned = daySchedules.some(s => s.cabinet_id == null);
  const cabinetColumns: { id: number | 'none'; name: string; color?: string }[] = [
    ...cabinets,
    ...(hasUnassigned ? [{ id: 'none' as const, name: 'Fără cabinet' }] : []),
  ];
  const dayStatusFor = (cabinetId: number): 'liber' | 'ocupat' =>
    dayStatuses.find(s => s.cabinet_id === cabinetId && s.day_of_week === selectedDow)?.status ?? 'liber';

  // Solfegiu groups — each group's own weekly session(s): day, hour, teacher.
  // Visible to everyone who can see this page, parents included, same as the
  // rest of this shared timetable board (sourced from the same unscoped
  // recurring-schedules fetch above, not from per-student data).
  const solfegiuSchedules = allSchedules.filter(s => s.discipline === SOLFEGIU && s.group_name);
  const hasSolfegiuGroups = solfegiuSchedules.length > 0;

  // Mobile view: a chronological timeline, grouped by time, across all cabinets —
  // no cramped multi-column table to scroll sideways on a phone. Shows every
  // fixed hour slot for the day (same Mon–Fri / Sat–Sun ranges as the desktop
  // CRM grid, from timeSlotsForDay), not just the ones with a lesson booked —
  // an elev checking "Program General" needs the same fixed hours either way.

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Banner ────────────────────────────────────────── */}
      {role !== 'student' && (
        <PageBanner
          icon={CalendarRange}
          title="Program General"
          subtitle="Orarul fix al elevilor — doar citire"
          accent="#5934DC"
        />
      )}

      <main className="flex-1 min-h-0 overflow-hidden flex flex-col p-3 sm:p-4 gap-3 sm:gap-4">
        {/* min-h-0 below is load-bearing: without it, a flex-1 child defaults to
            its CONTENT's height (flexbox's min-height:auto), so the card grows
            or shrinks with how many lessons that day has instead of staying a
            fixed size — exactly the "jumps up and down on day switch" bug. */}
        <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
          {/* Day tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-2.5 sm:p-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 overflow-x-auto">
            {DAY_LABELS.map((label, i) => {
              const isTodayTab = i === todayDayIdx();
              const isSelected = i === selectedDayIdx;
              return (
                <button
                  key={label}
                  onClick={() => setSelectedDayIdx(i)}
                  className={`relative flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150
                    ${isSelected ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 scale-[1.02]' : isTodayTab ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  <span className="sm:hidden">{DAY_SHORT[i]}</span>
                  <span className="hidden sm:inline">{label}</span>
                  {isTodayTab && !isSelected && <span className="w-1 h-1 rounded-full bg-brand-500" />}
                </button>
              );
            })}
          </div>

          {/* ── Desktop: cabinet × time grid ─────────────────── */}
          <div className="hidden sm:block flex-1 min-h-0 overflow-auto p-4" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
            {cabinetColumns.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-sm font-semibold text-slate-500">Nu există cabinete configurate</p>
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-0" style={{ minWidth: 320, tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    {/* table-layout: fixed (above) + an explicit width here is what makes every
                        cabinet column — and so every cell/"square" below — exactly the same size,
                        instead of a column with a longer name/discipline silently growing wider
                        than its neighbors. Columns with no width share the rest equally. */}
                    <th className="sticky top-0 z-10 bg-brand-50 dark:bg-brand-950/60 border-b-2 border-brand-200 dark:border-brand-900 px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 text-left w-24 rounded-tl-xl">
                      Ora
                    </th>
                    {cabinetColumns.map((col, i) => {
                      const status = typeof col.id === 'number' ? dayStatusFor(col.id) : null;
                      const label = col.id === 'none' ? col.name : /cabinet/i.test(col.name) ? col.name : `Cabinet ${col.name}`;
                      return (
                        <th
                          key={col.id}
                          className={`sticky top-0 z-10 bg-brand-50 dark:bg-brand-950/60 border-b-2 border-brand-200 dark:border-brand-900 px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 text-left align-top ${i === cabinetColumns.length - 1 ? 'rounded-tr-xl' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            {col.color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }} />}
                            <span>{label}</span>
                            {status === 'ocupat' && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full normal-case bg-red-100 text-red-700">
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
                  {timeSlots.map((time, idx) => {
                    const current = isCurrentSlot(time, timeSlots[idx + 1], isToday);
                    return (
                      <tr key={time} className={current ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}>
                        <td className={`border-b border-slate-100 dark:border-slate-800 px-4 py-3 text-sm font-mono font-bold whitespace-nowrap ${current ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400'}`}>
                          <span className="flex items-center gap-1.5">
                            {current && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />}
                            {time}
                          </span>
                        </td>
                        {cabinetColumns.map(col => {
                          const key = `${col.id}|${time}`;
                          const cellSchedules = byCabinetTime[key] ?? [];
                          return (
                            <td key={col.id} className="border-b border-slate-100 dark:border-slate-800 px-2 py-2 align-top overflow-hidden">
                              {/* Fixed min-height so an empty cell is the same size as one with a
                                  lesson — only genuinely stacked double-bookings grow taller. */}
                              <div className="flex flex-col gap-1.5 min-h-[52px]">
                                {cellSchedules.length === 0 ? (
                                  <div className="h-full min-h-[48px] rounded-lg border border-dashed border-slate-200 dark:border-slate-700" />
                                ) : cellSchedules.map(s => (
                                  <LessonBlock key={s.id} s={s} accentColor={cabinetAccent(typeof col.id === 'number' ? col.color : undefined)} />
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Mobile: chronological timeline, no sideways table scroll ──
              Shows every fixed slot of the day (same as the desktop grid —
              13:15-20:45 Luni-Vineri, 09:00-17:15 Sâmbătă-Duminică), each
              marked "Liber" when nothing's booked there, instead of only
              the occupied ones — so the hours match the CRM exactly. */}
          <div className="sm:hidden flex-1 min-h-0 overflow-y-auto p-3">
            {timeSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <CalendarRange className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-400">Nicio lecție în ziua asta</p>
              </div>
            ) : (
              <div className="space-y-4">
                {timeSlots.map((time, idx) => {
                  const lessons = daySchedules.filter(s => (s.start_time ?? '').slice(0, 5) === time);
                  const current = isCurrentSlot(time, timeSlots[idx + 1], isToday);
                  return (
                    <div key={time} className="flex gap-3">
                      <div className="flex flex-col items-center flex-shrink-0 w-14">
                        <div className={`flex items-center gap-1 text-xs font-bold font-mono px-2 py-1 rounded-lg ${current ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          <Clock className="w-3 h-3" />
                          {time}
                        </div>
                        {idx < timeSlots.length - 1 && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1.5" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5 pb-1">
                        {lessons.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-3">
                            <p className="text-xs text-slate-400 dark:text-slate-500 italic">Liber</p>
                          </div>
                        ) : lessons.map(s => {
                          const cab = cabinets.find(c => c.id === s.cabinet_id);
                          const accent = cabinetAccent(cab?.color);
                          const groupColor = s.group_name ? SOLFEGIU_GROUP_COLORS[s.group_name] : null;
                          return (
                            <div
                              key={s.id}
                              className={`rounded-xl border p-3 shadow-sm ${groupColor ? groupColor.block : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                              style={groupColor ? undefined : { borderLeftWidth: 3, borderLeftColor: accent }}
                            >
                              <p className={`font-bold text-sm truncate ${groupColor ? '' : 'text-slate-800 dark:text-slate-100'}`}>{displayName(s)}</p>
                              <div className={`flex items-center gap-2 mt-1 text-xs ${groupColor ? 'opacity-80' : 'text-slate-500 dark:text-slate-400'}`}>
                                <span className="font-semibold" style={groupColor ? undefined : { color: accent }}>{s.discipline || '—'}</span>
                                <span>· {s.teacher_name}</span>
                              </div>
                              {cab && (
                                <div className={`flex items-center gap-1 mt-1.5 text-[11px] ${groupColor ? 'opacity-70' : 'text-slate-400'}`}>
                                  <MapPin className="w-3 h-3" />
                                  {/cabinet/i.test(cab.name) ? cab.name : `Cabinet ${cab.name}`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Solfegiu groups — each group's own weekly session(s) ── */}
        {hasSolfegiuGroups && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users2 className="w-4 h-4 text-cyan-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Grupe Solfegiu</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SOLFEGIU_GROUPS.map(g => {
                const sessions = solfegiuSchedules.filter(s => s.group_name === g.value);
                const color = SOLFEGIU_GROUP_COLORS[g.value];
                return (
                  <div key={g.value} className={`rounded-xl border p-3 ${color.block}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wide">{g.label}</p>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${color.badge}`}>{sessions.length}</span>
                    </div>
                    {sessions.length > 0 ? (
                      <div className="space-y-1">
                        {sessions.map(s => (
                          <p key={s.id} className="text-[11px] font-medium">
                            {DAY_LABELS[(s.day_of_week + 6) % 7]} · {(s.start_time ?? '').slice(0, 5)} — {s.teacher_name}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] italic opacity-70">Nicio oră programată</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Legend ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pb-1">
          <span>Orar fix — se repetă în fiecare săptămână.</span>
          <span className="ml-auto text-[11px] opacity-50 italic hidden sm:inline">Mod vizualizare</span>
        </div>
      </main>
    </div>
  );
}
