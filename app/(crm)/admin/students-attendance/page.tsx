'use client';

import { Fragment, useState } from 'react';
import useSWR, { preload } from 'swr';
import { useRouter } from 'next/navigation';
import { ChevronRight, ClipboardList, ChevronDown, Search } from 'lucide-react';
import MonthNav from '@/components/ui/MonthNav';
import Select from '@/components/ui/Select';
import PageBanner from '@/components/ui/PageBanner';
import { MonthlyStats, INSTRUMENTS, Student, Payment, Lesson, STUDENT_STATUSES } from '@/lib/types';
import { inRegister } from '@/lib/rosters';
import { monthEnd } from '@/lib/dates';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function pad2(n: number) { return String(n).padStart(2, '0'); }

const PAYMENT_LABEL: Record<string, string> = { paid: 'Plătit', unpaid: 'Neplătit', partial: 'Parțial', overdue: 'Restant' };
const PAYMENT_CLASS: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  unpaid: 'bg-red-50 text-red-700 border-red-200',
  partial: 'bg-orange-50 text-orange-700 border-orange-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
};

export default function StudentsAttendancePage() {
  const router = useRouter();
  const [monthOffset, setMonthOffset] = useState(0);
  const [fTeacher, setFTeacher] = useState('');
  const [fDiscipline, setFDiscipline] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const ref = new Date();
  ref.setDate(1);
  ref.setMonth(ref.getMonth() + monthOffset);
  const year = ref.getFullYear();
  const monthNum = ref.getMonth() + 1;
  const month = `${year}-${pad2(monthNum)}`;
  const monthLabel = ref.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

  const { data: teachersData } = useSWR('/api/teachers', fetcher);
  const { data: studentsData } = useSWR('/api/students', fetcher);
  const allStudentsFull: Student[] = studentsData?.students ?? [];
  const studentById = new Map(allStudentsFull.map(s => [s.id, s]));

  const params = new URLSearchParams({ month });
  if (fTeacher) params.set('teacher_id', fTeacher);
  if (fDiscipline) params.set('discipline', fDiscipline);

  const { data, isLoading } = useSWR(`/api/students/stats?${params.toString()}`, fetcher);
  const statsAll: MonthlyStats[] = data?.stats ?? [];
  // A student with zero lesson rows that month (e.g. the recurring schedule
  // hasn't generated next month's lessons for them yet) would otherwise just
  // vanish from this list entirely — fill in a zero-stats row for every
  // active, enrolled student the API's own filters didn't already return.
  const statsById = new Map(statsAll.map(s => [s.student_id, s]));
  const filterTeacherId = fTeacher ? Number(fTeacher) : null;
  for (const s of allStudentsFull) {
    if (statsById.has(s.id)) continue;
    if (!inRegister(s, fDiscipline, filterTeacherId)) continue;
    statsById.set(s.id, {
      student_id: s.id, student_name: s.name, discipline: fDiscipline || null,
      total: 0, scheduled: 0, completed: 0, cancelled: 0, recovered: 0, present: 0, excused_absence: 0, unexcused_absence: 0,
    });
  }
  const statsMerged = Array.from(statsById.values()).sort((a, b) => (a.student_name ?? '').localeCompare(b.student_name ?? ''));
  const stats = statsMerged
    .filter(s => !search.trim() || (s.student_name ?? '').toLowerCase().includes(search.trim().toLowerCase()))
    .filter(s => {
      if (showInactive) return true;
      const student = s.student_id ? studentById.get(s.student_id) : undefined;
      return !student || (student.status ?? 'active') === 'active';
    });
  const teachers = teachersData?.teachers ?? [];

  // Per (student, instrument) lesson tallies this month — the same source
  // feeds both the collapsed row's per-instrument totals and the expanded
  // panel, so "8 lecții la Canto" always means the same thing everywhere.
  type DisciplineRow = { student_id: number; discipline: string; total: number; done: number; recovered: number; excused_absence: number; unexcused_absence: number };
  const byDiscipline: DisciplineRow[] = data?.byDiscipline ?? [];
  const disciplineRow = (studentId?: number, instrument?: string) =>
    byDiscipline.find(r => r.student_id === studentId && r.discipline === instrument);
  const doneFor = (studentId?: number, instrument?: string) => disciplineRow(studentId, instrument)?.done ?? 0;
  const excusedFor = (studentId?: number, instrument?: string) => disciplineRow(studentId, instrument)?.excused_absence ?? 0;
  const unexcusedFor = (studentId?: number, instrument?: string) => disciplineRow(studentId, instrument)?.unexcused_absence ?? 0;
  const recoveredFor = (studentId?: number, instrument?: string) => disciplineRow(studentId, instrument)?.recovered ?? 0;

  const { data: expPaymentsData } = useSWR(expandedId ? `/api/payments?student_id=${expandedId}&month=${monthNum}&year=${year}` : null, fetcher);
  const expandedPayment: Payment | undefined = (expPaymentsData?.payments ?? [])[0];
  const expandedStudent = expandedId ? studentById.get(expandedId) : undefined;

  // Who/when behind each Motivată/Nemotivată/Recuperare tally — fetched only
  // for the expanded student, for this month, and matched to the right
  // instrument card by `discipline`.
  const monthFrom = `${year}-${pad2(monthNum)}-01`;
  const monthTo = monthEnd(year, monthNum);
  const { data: expLessonsData } = useSWR(
    expandedId ? `/api/lessons?student_id=${expandedId}&from=${monthFrom}&to=${monthTo}` : null, fetcher,
  );
  const expandedLessons: Lesson[] = expLessonsData?.lessons ?? [];
  type LessonDetail = { kind: 'excused' | 'unexcused' | 'recovered'; date: string; time: string; teacher: string; replaced?: string };
  const detailsFor = (instrument: string): LessonDetail[] =>
    expandedLessons
      .filter(l => l.discipline === instrument)
      .map((l): LessonDetail | null => {
        const kind = l.status === 'recovered' ? 'recovered' as const
          : l.attendance_status === 'excused_absence' ? 'excused' as const
          : l.attendance_status === 'unexcused_absence' ? 'unexcused' as const
          : null;
        if (!kind) return null;
        return {
          kind, date: l.date, time: (l.time ?? '').slice(0, 5),
          teacher: l.replacement_teacher_name ?? l.teacher_name ?? '—',
          replaced: l.replacement_teacher_name ? (l.teacher_name ?? undefined) : undefined,
        };
      })
      .filter((d): d is LessonDetail => d !== null)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const DETAIL_LABEL: Record<LessonDetail['kind'], string> = { excused: 'Motivată', unexcused: 'Nemotivată', recovered: 'Recuperare' };
  const DETAIL_CLASS: Record<LessonDetail['kind'], string> = {
    excused: 'text-amber-600 dark:text-amber-400', unexcused: 'text-red-600 dark:text-red-400', recovered: 'text-accent-600 dark:text-accent-400',
  };
  const fmtDetailDate = (d: string) => {
    const dt = new Date(`${d}T00:00:00`);
    return dt.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  };

  // Desktop: the row expands inline. Phone/tablet (below lg) gets cards that
  // open the student's profile as its own page instead — and the profile's
  // data starts loading on finger-down, so by the time the tap lands the page
  // usually renders straight away (no "Se încarcă…" flash between the two).
  const toggleRow = (id?: number) => {
    if (!id) return;
    setExpandedId(prev => prev === id ? null : id);
  };
  const warmProfile = (id?: number) => {
    if (!id) return;
    router.prefetch(`/admin/students/${id}`);
    preload(`/api/students/${id}`, fetcher);
    preload(`/api/lessons?student_id=${id}`, fetcher);
    preload(`/api/payments?student_id=${id}`, fetcher);
  };
  const openProfile = (id?: number) => {
    if (!id) return;
    warmProfile(id);
    router.push(`/admin/students/${id}`);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageBanner
        icon={ClipboardList}
        title="Elevi Frecvență"
        subtitle="Frecvența tuturor elevilor, calculată live din Program"
        accent="#F59E0B"
      />

      <main className="flex-1 min-h-0 p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 shadow-sm grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <MonthNav
            label={monthLabel}
            onPrev={() => setMonthOffset(m => m - 1)}
            onNext={() => setMonthOffset(m => Math.min(m + 1, 0))}
            nextDisabled={monthOffset >= 0}
            className="col-span-2 sm:w-64"
          />
          <div className="relative col-span-2 sm:flex-1 sm:min-w-40 sm:max-w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Caută elev…"
              className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div className="min-w-0 sm:w-40"><Select value={fTeacher} onChange={e => setFTeacher(e.target.value)} placeholder="Profesor" options={teachers.map((t: { id: number; name: string }) => ({ value: t.id, label: t.name }))} /></div>
          <div className="min-w-0 sm:w-40"><Select value={fDiscipline} onChange={e => setFDiscipline(e.target.value)} placeholder="Disciplină" options={INSTRUMENTS.map(i => ({ value: i, label: i }))} /></div>
          <label className="col-span-2 flex items-center justify-center sm:justify-start gap-1.5 h-9 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
            Arată și inactivi/pauză
          </label>
        </div>

        {/* Phone / tablet: compact cards — tap opens the profile */}
        <div className="lg:hidden space-y-2">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[92px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
            ))
          ) : stats.length === 0 ? (
            <p className="text-center py-10 text-sm text-slate-400">Niciun elev găsit</p>
          ) : stats.map(s => {
            const student = s.student_id ? studentById.get(s.student_id) : undefined;
            const subs = (student?.subscriptions ?? []).filter(sub => !fDiscipline || sub.instrument === fDiscipline);
            return (
              <button
                key={s.student_id}
                type="button"
                onPointerDown={() => warmProfile(s.student_id)}
                onClick={() => openProfile(s.student_id)}
                className="w-full text-left rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm px-3 py-2.5 transition-transform duration-150 active:scale-[0.98] active:bg-slate-50 dark:active:bg-slate-800/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{s.student_name}</p>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
                {subs.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {subs.map(sub => {
                      const done = doneFor(s.student_id, sub.instrument);
                      const complete = done >= sub.lessons;
                      return (
                        <div key={sub.instrument} className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="truncate text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{sub.instrument}</span> · {sub.teacher_name ?? '—'}
                          </span>
                          <span className={`shrink-0 font-bold tabular-nums ${complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'}`}>
                            {Math.min(done, sub.lessons)}/{sub.lessons}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {([
                    ['Finaliz.', s.completed, 'text-emerald-600 dark:text-emerald-400'],
                    ['Recup.', s.recovered, 'text-accent-600 dark:text-accent-400'],
                    ['Motiv.', s.excused_absence, 'text-amber-600 dark:text-amber-400'],
                    ['Nemot.', s.unexcused_absence, 'text-red-600 dark:text-red-400'],
                  ] as const).map(([label, value, color]) => (
                    <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 py-1 text-center">
                      <p className={`text-sm font-extrabold leading-tight tabular-nums ${color}`}>{value}</p>
                      <p className="text-[9px] uppercase tracking-wide text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3">Elev</th>
                  <th className="px-4 py-3">Profesor / Instrument</th>
                  <th className="px-3 py-3 text-left">Total / instrument</th>
                  <th className="px-3 py-3 text-center">Finalizate</th>
                  <th className="px-3 py-3 text-center">Recuperate</th>
                  <th className="px-3 py-3 text-center">Abs. mot.</th>
                  <th className="px-3 py-3 text-center">Abs. nemot.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-400">Se încarcă…</td></tr>
                ) : stats.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-400">Niciun elev găsit</td></tr>
                ) : stats.map(s => {
                  const student = s.student_id ? studentById.get(s.student_id) : undefined;
                  const subs = student?.subscriptions ?? [];
                  const isOpen = expandedId === s.student_id;
                  // "Total" = the subscription's lesson allotment (e.g. 8 lecții/lună), not a raw
                  // lesson-row count — falls back to the live count for legacy students with no
                  // subscriptions configured yet.
                  const relevantSubs = subs.filter(sub => (!fDiscipline || sub.instrument === fDiscipline) && (sub.status ?? 'active') === 'active');
                  const subscriptionTotal = relevantSubs.reduce((sum, sub) => sum + (Number(sub.lessons) || 0), 0);
                  const displayTotal = subs.length > 0 ? subscriptionTotal : s.total;
                  return (
                    <Fragment key={s.student_id}>
                      <tr
                        onClick={() => toggleRow(s.student_id)}
                        className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isOpen ? 'bg-slate-50 dark:bg-slate-800/40' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{s.student_name}</td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                          {subs.length > 1 ? (
                            <div className="flex flex-col gap-0.5">
                              {subs.map(sub => (
                                <span key={sub.instrument} className="text-xs whitespace-nowrap">
                                  <span className="font-semibold text-slate-600 dark:text-slate-300">{sub.instrument}:</span> {sub.teacher_name ?? '—'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="whitespace-nowrap">{subs[0]?.teacher_name ?? s.teacher_name ?? '—'}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-left">
                          {subs.length === 0 ? (
                            <span className="font-bold text-slate-800 dark:text-slate-100">{displayTotal}</span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              {subs.map(sub => {
                                const done = doneFor(s.student_id, sub.instrument);
                                const remaining = Math.max(0, sub.lessons - done);
                                const over = Math.max(0, done - sub.lessons);
                                return (
                                  <span key={sub.instrument} className="text-xs whitespace-nowrap">
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{sub.instrument}: {sub.lessons} lecții</span>{' '}
                                    <span className={`font-semibold ${over > 0 ? 'text-orange-600 dark:text-orange-400' : remaining === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'}`}>
                                      ({over > 0 ? `+${over} peste abonament` : remaining === 0 ? 'complet' : `${remaining} rămase`})
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400">{s.completed}</td>
                        <td className="px-3 py-2.5 text-center text-accent-600 dark:text-accent-400">{s.recovered}</td>
                        <td className="px-3 py-2.5 text-center text-amber-600 dark:text-amber-400">{s.excused_absence}</td>
                        <td className="px-3 py-2.5 text-center text-red-600 dark:text-red-400">{s.unexcused_absence}</td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={8} className="bg-slate-50 dark:bg-slate-800/30 p-0">
                            <div className="p-4">
                              {!student ? (
                                <p className="text-xs text-slate-400 py-4 text-center">Se încarcă detaliile…</p>
                              ) : (
                                <div className="space-y-3">
                                  {/* Payment summary for the selected month */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Plată {monthLabel}:</span>
                                    {expandedPayment ? (
                                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${PAYMENT_CLASS[expandedPayment.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {PAYMENT_LABEL[expandedPayment.status] ?? expandedPayment.status} · {Number(expandedPayment.amount).toLocaleString()} MDL
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-400 italic">Nicio plată înregistrată</span>
                                    )}
                                  </div>

                                  {/* Per-instrument subscription breakdown */}
                                  {subs.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Niciun abonament configurat pentru acest elev.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                      {subs.map(sub => {
                                        const done = doneFor(student.id, sub.instrument);
                                        const remaining = Math.max(0, sub.lessons - done);
                                        // More lessons marked than the subscription covers (e.g. extra
                                        // sessions added by hand) — flagged instead of silently showing
                                        // a "Complet" that hides the overshoot, or a done/total ratio
                                        // over 100% with no explanation.
                                        const over = Math.max(0, done - sub.lessons);
                                        const stStatus = sub.status ?? 'active';
                                        const stLabel = STUDENT_STATUSES.find(st => st.value === stStatus)?.label ?? stStatus;
                                        const dotColor = stStatus === 'active' ? 'bg-emerald-500' : stStatus === 'paused' ? 'bg-amber-500' : 'bg-slate-400';
                                        return (
                                          <div key={sub.instrument} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{sub.instrument}</p>
                                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />{stLabel}
                                              </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Profesor: <span className="font-medium text-slate-700 dark:text-slate-300">{sub.teacher_name ?? 'Neatribuit'}</span></p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Abonament: <span className="font-medium text-slate-700 dark:text-slate-300">{sub.plan === 'old' ? 'vechi' : 'nou'} · {sub.lessons} lecții/lună</span></p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Preț: <span className="font-medium text-slate-700 dark:text-slate-300">{sub.monthly_fee} lei/lună</span></p>
                                            <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100 dark:border-slate-800">
                                              <span className="text-xs text-slate-500 dark:text-slate-400">Făcute: <strong className={over > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}>{done}</strong>/{sub.lessons}</span>
                                              <span className={`text-xs font-bold ${over > 0 ? 'text-orange-600 dark:text-orange-400' : remaining === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'}`}>
                                                {over > 0 ? `+${over} peste abonament` : remaining === 0 ? 'Complet' : `${remaining} rămase`}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] pt-0.5">
                                              <span className="text-amber-600 dark:text-amber-400">Motivate: <strong>{excusedFor(student.id, sub.instrument)}</strong></span>
                                              <span className="text-red-600 dark:text-red-400">Nemotivate: <strong>{unexcusedFor(student.id, sub.instrument)}</strong></span>
                                              <span className="text-accent-600 dark:text-accent-400">Recuperate: <strong>{recoveredFor(student.id, sub.instrument)}</strong></span>
                                            </div>
                                            {(() => {
                                              const details = detailsFor(sub.instrument);
                                              if (details.length === 0) return null;
                                              return (
                                                <div className="pt-1.5 mt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                                                  {details.map((d, i) => (
                                                    <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                                                      <span className={`font-semibold ${DETAIL_CLASS[d.kind]}`}>{DETAIL_LABEL[d.kind]}</span>
                                                      <span className="text-slate-500 dark:text-slate-400 text-right">
                                                        {fmtDetailDate(d.date)}, {d.time} ·{' '}
                                                        {d.replaced ? (
                                                          <span>{d.teacher} <span className="text-violet-500 dark:text-violet-400">(înloc. {d.replaced})</span></span>
                                                        ) : d.teacher}
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
