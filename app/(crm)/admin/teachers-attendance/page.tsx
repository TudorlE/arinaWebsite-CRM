'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ClipboardList, Users } from 'lucide-react';
import MonthNav from '@/components/ui/MonthNav';
import Select from '@/components/ui/Select';
import PageBanner from '@/components/ui/PageBanner';
import { MonthlyStats, INSTRUMENTS, LessonOccurrence } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function pad2(n: number) { return String(n).padStart(2, '0'); }

type DetailKind = 'recovered' | 'excused' | 'unexcused' | 'replaced';
type DetailChip = { key: string; text: string; count: number; dates: LessonOccurrence[] };

const plain = (list?: { name: string; count: number; dates?: LessonOccurrence[] }[]): DetailChip[] =>
  (list ?? []).map(s => ({ key: s.name, text: s.name, count: s.count, dates: s.dates ?? [] }));

/** "12 sept., 14:00" — when exactly the lesson was, for the admin. */
function fmtOccurrence(o: LessonOccurrence) {
  const d = new Date(`${o.date}T00:00:00`).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });
  return o.time ? `${d}, ${o.time}` : d;
}

/** The clickable counters: tap one to list which students make up that number. */
const DETAIL_KINDS: {
  kind: DetailKind; label: string; title: string; empty: string; hint?: string;
  number: string; hover: string; panel: string; chip: string;
  count: (t: MonthlyStats) => number; students: (t: MonthlyStats) => DetailChip[];
}[] = [
  {
    kind: 'recovered', label: 'Recuperate', title: 'Recuperări', empty: 'Nicio recuperare luna asta',
    number: 'text-accent-600 dark:text-accent-400', hover: 'enabled:hover:bg-sky-50 dark:enabled:hover:bg-sky-900/20',
    panel: 'bg-sky-50/60 dark:bg-sky-900/10', chip: 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300',
    count: t => t.recovered, students: t => plain(t.recovered_students),
  },
  {
    kind: 'excused', label: 'Motivate', title: 'Absențe motivate', empty: 'Nicio absență motivată luna asta',
    number: 'text-amber-600 dark:text-amber-400', hover: 'enabled:hover:bg-amber-50 dark:enabled:hover:bg-amber-900/20',
    panel: 'bg-amber-50/60 dark:bg-amber-900/10', chip: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    count: t => t.excused_absence, students: t => plain(t.excused_students),
  },
  {
    kind: 'unexcused', label: 'Nemotivate', title: 'Absențe nemotivate', empty: 'Nicio absență nemotivată luna asta',
    number: 'text-red-600 dark:text-red-400', hover: 'enabled:hover:bg-red-50 dark:enabled:hover:bg-red-900/20',
    panel: 'bg-red-50/60 dark:bg-red-900/10', chip: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    count: t => t.unexcused_absence, students: t => plain(t.unexcused_students),
  },
  {
    kind: 'replaced', label: 'Înlocuite', title: 'Înlocuiri făcute', empty: 'Nicio înlocuire luna asta',
    hint: 'Lecții ținute în locul altui profesor',
    number: 'text-violet-600 dark:text-violet-400', hover: 'enabled:hover:bg-violet-50 dark:enabled:hover:bg-violet-900/20',
    panel: 'bg-violet-50/60 dark:bg-violet-900/10', chip: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300',
    count: t => t.replaced ?? 0,
    students: t => (t.replaced_students ?? []).map(s => ({
      key: `${s.name}|${s.for_teacher}|${s.discipline}`,
      text: `${s.name}${s.discipline ? ` (${s.discipline})` : ''}${s.for_teacher ? ` — pt. ${s.for_teacher}` : ''}`,
      count: s.count,
      dates: s.dates ?? [],
    })),
  },
];

export default function TeachersAttendancePage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [fDiscipline, setFDiscipline] = useState('');
  const [expanded, setExpanded] = useState<{ id: number; kind: DetailKind } | null>(null);
  const toggle = (id: number | undefined, kind: DetailKind) =>
    setExpanded(cur => (cur?.id === id && cur?.kind === kind) || id == null ? null : { id, kind });

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
    <div className="flex flex-col flex-1 min-h-0">
      <PageBanner
        icon={ClipboardList}
        title="Profesori Frecvență"
        subtitle="Activitatea fiecărui profesor, calculată live din Program"
        accent="#AC2A88"
      />

      <main className="flex-1 min-h-0 p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 shadow-sm grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <MonthNav
            label={monthLabel}
            onPrev={() => setMonthOffset(m => m - 1)}
            onNext={() => setMonthOffset(m => Math.min(m + 1, 0))}
            nextDisabled={monthOffset >= 0}
            className="sm:w-64"
          />
          <div className="sm:w-40"><Select value={fDiscipline} onChange={e => setFDiscipline(e.target.value)} placeholder="Disciplină" options={INSTRUMENTS.map(i => ({ value: i, label: i }))} /></div>
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
                <div className="px-3 py-2.5 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{t.teacher_name}</p>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{t.total}</p>
                    <p className="text-[10px] text-slate-400">Total așteptat</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{t.completed}</p>
                    <p className="text-[10px] text-slate-400">Finalizate</p>
                  </div>
                  {DETAIL_KINDS.map(k => {
                    const count = k.count(t);
                    return (
                      <button
                        key={k.kind}
                        type="button"
                        onClick={() => toggle(t.teacher_id, k.kind)}
                        disabled={count === 0}
                        title={k.hint}
                        className={`text-center rounded-lg transition-colors disabled:cursor-default enabled:cursor-pointer py-0.5 ${k.hover} ${expanded?.id === t.teacher_id && expanded?.kind === k.kind ? k.panel : ''}`}
                      >
                        <p className={`text-xl font-extrabold ${k.number}`}>{count}</p>
                        <p className="text-[10px] text-slate-400">{k.label}</p>
                      </button>
                    );
                  })}
                </div>
                {DETAIL_KINDS.filter(k => expanded?.id === t.teacher_id && expanded?.kind === k.kind).map(k => {
                  const list = k.students(t);
                  return (
                    <div key={k.kind} className={`px-3 py-2.5 sm:px-5 sm:py-3 border-b border-slate-100 dark:border-slate-800 ${k.panel}`}>
                      <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${k.number}`}>
                        {k.title} — {t.teacher_name}
                      </p>
                      <div className="space-y-2">
                        {list.map(s => (
                          <div key={s.key}>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {s.text}{s.count > 1 ? <span className="font-normal text-slate-400"> ×{s.count}</span> : null}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {s.dates.map((o, i) => (
                                <span key={i} className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${k.chip}`}>
                                  {fmtOccurrence(o)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                        {list.length === 0 && <span className="text-xs text-slate-400">{k.empty}</span>}
                      </div>
                    </div>
                  );
                })}
                <div className="px-3 py-2.5 sm:px-5 sm:py-4">
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
