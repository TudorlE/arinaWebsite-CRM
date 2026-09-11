'use client';

import { Fragment, useState } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, ClipboardList, ChevronDown, Search } from 'lucide-react';
import Select from '@/components/ui/Select';
import { MonthlyStats, INSTRUMENTS, Student, Lesson, Payment, STUDENT_STATUSES } from '@/lib/types';

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
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${pad2(new Date(year, monthNum, 0).getDate())}`;
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
  const stats = statsAll
    .filter(s => !search.trim() || (s.student_name ?? '').toLowerCase().includes(search.trim().toLowerCase()))
    .filter(s => {
      if (showInactive) return true;
      const student = s.student_id ? studentById.get(s.student_id) : undefined;
      return !student || (student.status ?? 'active') === 'active';
    });
  const teachers = teachersData?.teachers ?? [];

  // Lazily loaded, only for the currently expanded student.
  const { data: expLessonsData } = useSWR(expandedId ? `/api/lessons?student_id=${expandedId}` : null, fetcher);
  const { data: expPaymentsData } = useSWR(expandedId ? `/api/payments?student_id=${expandedId}&month=${monthNum}&year=${year}` : null, fetcher);
  const expandedLessons: Lesson[] = expLessonsData?.lessons ?? [];
  const expandedPayment: Payment | undefined = (expPaymentsData?.payments ?? [])[0];
  const expandedStudent = expandedId ? studentById.get(expandedId) : undefined;

  const doneThisMonth = (instrument: string) => expandedLessons.filter(l =>
    l.discipline === instrument && l.date >= monthStart && l.date <= monthEnd
    && (l.status === 'completed' || l.attendance_status === 'present'),
  ).length;

  const toggleRow = (id?: number) => {
    if (!id) return;
    setExpandedId(prev => prev === id ? null : id);
  };

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
          <div className="relative flex-1 min-w-40 max-w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Caută elev…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div className="w-40"><Select value={fTeacher} onChange={e => setFTeacher(e.target.value)} placeholder="Profesor" options={teachers.map((t: { id: number; name: string }) => ({ value: t.id, label: t.name }))} /></div>
          <div className="w-40"><Select value={fDiscipline} onChange={e => setFDiscipline(e.target.value)} placeholder="Disciplină" options={INSTRUMENTS.map(i => ({ value: i, label: i }))} /></div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
            Arată și inactivi/pauză
          </label>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3">Elev</th>
                  <th className="px-4 py-3">Profesor / Instrument</th>
                  <th className="px-3 py-3 text-center">Total</th>
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
                        <td className="px-3 py-2.5 text-center font-bold text-slate-800 dark:text-slate-100">{displayTotal}</td>
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
                                        const done = doneThisMonth(sub.instrument);
                                        const remaining = Math.max(0, sub.lessons - done);
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
                                              <span className="text-xs text-slate-500 dark:text-slate-400">Făcute: <strong className="text-emerald-600 dark:text-emerald-400">{done}</strong>/{sub.lessons}</span>
                                              <span className={`text-xs font-bold ${remaining === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'}`}>
                                                {remaining === 0 ? 'Complet' : `${remaining} rămase`}
                                              </span>
                                            </div>
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
