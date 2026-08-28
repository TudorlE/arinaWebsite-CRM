'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { ClipboardList, ChevronLeft, ChevronRight, Pencil, Trash2, Download } from 'lucide-react';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LessonForm from '@/components/lessons/LessonForm';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Lesson, Student, Teacher, INSTRUMENTS } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const WEEKDAY_LETTERS = ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S']; // 0=Sun..6=Sat

function fmtDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function daysInMonth(ref: Date): Date[] {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => new Date(year, month, i + 1));
}

type Mark = 'present' | 'excused_absence' | 'unexcused_absence' | 'cancelled' | 'recovered';

const MARK_OPTIONS: { mark: Mark; char: string; label: string; className: string }[] = [
  { mark: 'present',           char: '✓', label: 'Prezent / Finalizată',   className: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
  { mark: 'excused_absence',   char: 'M', label: 'Absență motivată',       className: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200' },
  { mark: 'unexcused_absence', char: 'N', label: 'Absență nemotivată',     className: 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200' },
  { mark: 'cancelled',         char: 'X', label: 'Anulată',                className: 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200' },
  { mark: 'recovered',         char: 'R', label: 'Recuperare',             className: 'text-sky-700 bg-sky-50 hover:bg-sky-100 border-sky-200' },
];

function symbolFor(l: Lesson): { char: string; className: string; title: string } {
  if (l.status === 'cancelled') return { char: 'X', className: 'text-red-700 bg-red-50', title: 'Anulată' };
  if (l.status === 'recovered') return { char: 'R', className: 'text-sky-700 bg-sky-50', title: 'Recuperare' };
  if (l.attendance_status === 'unexcused_absence') return { char: 'N', className: 'text-rose-700 bg-rose-50', title: 'Absență nemotivată' };
  if (l.attendance_status === 'excused_absence') return { char: 'M', className: 'text-amber-700 bg-amber-50', title: 'Absență motivată' };
  if (l.attendance_status === 'late') return { char: 'Î', className: 'text-blue-700 bg-blue-50', title: 'Întârziere' };
  if (l.status === 'completed' || l.attendance_status === 'present') return { char: '✓', className: 'text-emerald-700 bg-emerald-50', title: 'Prezent / Finalizată' };
  return { char: '•', className: 'text-slate-300', title: `Programată · ${l.time?.slice(0, 5)} · ${l.discipline ?? 'fără disciplină'} — click pentru a marca` };
}

export default function AttendanceRegisterPage() {
  const [role, setRole] = useState<string | null>(null);
  const [myTeacherId, setMyTeacherId] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { setRole(d.user?.role ?? null); setMyTeacherId(d.user?.teacher_id ?? null); }).catch(() => {});
  }, []);
  const canEdit = role === 'admin' || role === 'teacher';

  const { toasts, toast, remove } = useToast();
  const [monthRef, setMonthRef] = useState(new Date());
  const [fTeacher, setFTeacher] = useState('');
  const [fDiscipline, setFDiscipline] = useState('');
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [savingCell, setSavingCell] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [addStudentId, setAddStudentId] = useState<number | undefined>(undefined);
  const [addDate, setAddDate] = useState('');
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: studentsData } = useSWR('/api/students', fetcher);
  const { data: teachersData } = useSWR('/api/teachers', fetcher);
  const { data: lessonsData, mutate: mutateLessons } = useSWR('/api/lessons', fetcher);
  const allStudents: Student[] = studentsData?.students ?? [];
  const teachers: Teacher[] = teachersData?.teachers ?? [];
  const allLessons: Lesson[] = lessonsData?.lessons ?? [];

  const days = daysInMonth(monthRef);
  const from = fmtDate(days[0]);
  const to = fmtDate(days[days.length - 1]);
  const monthLessons = allLessons.filter(l => l.date >= from && l.date <= to);

  const effectiveTeacherId = role === 'teacher' ? myTeacherId : (fTeacher ? Number(fTeacher) : null);
  const students = allStudents
    .filter(s => !effectiveTeacherId || s.teacher_id === effectiveTeacherId)
    .filter(s => !fDiscipline || (s.instruments ?? []).includes(fDiscipline));

  const byCell: Record<string, Lesson[]> = {};
  for (const l of monthLessons) {
    if (effectiveTeacherId && l.teacher_id !== effectiveTeacherId) continue;
    if (fDiscipline && l.discipline !== fDiscipline) continue;
    const key = `${l.student_id}|${l.date}`;
    (byCell[key] ??= []).push(l);
  }

  const monthLabel = (() => {
    const s = monthRef.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  const setMark = async (lesson: Lesson, mark: Mark) => {
    const cellKey = `${lesson.student_id}|${lesson.date}`;
    setSavingCell(cellKey);
    try {
      if (mark === 'cancelled' || mark === 'recovered') {
        await fetch(`/api/lessons/${lesson.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: mark }),
        });
      } else if (mark === 'present') {
        await Promise.all([
          fetch(`/api/lessons/${lesson.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) }),
          fetch('/api/attendance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lesson_id: lesson.id, status: 'present' }) }),
        ]);
      } else {
        await fetch('/api/attendance', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lesson_id: lesson.id, status: mark }),
        });
      }
      mutateLessons();
      toast('Marcaj salvat', 'success');
    } catch {
      toast('Eroare la salvare', 'error');
    } finally {
      setSavingCell(null);
      setActiveCell(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/lessons/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast('Lecție ștearsă', 'success'); mutateLessons(); }
      else { const d = await res.json().catch(() => ({})); toast(d.error ?? 'Eroare la ștergere', 'error'); }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openCell = (student: Student, dateStr: string, cellLessons: Lesson[]) => {
    if (!canEdit) return;
    if (cellLessons.length === 0) {
      setAddStudentId(student.id);
      setAddDate(dateStr);
      setShowForm(true);
      return;
    }
    const key = `${student.id}|${dateStr}`;
    setActiveCell(prev => (prev === key ? null : key));
  };

  const exportUrl = `/api/attendance/export?date_from=${from}&date_to=${to}${effectiveTeacherId ? `&teacher_id=${effectiveTeacherId}` : ''}`;

  return (
    <div className="flex flex-col flex-1" onClick={() => activeCell !== null && setActiveCell(null)}>
      {/* ── Banner — warm/amber palette to stand apart from Program Privat/General ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="relative flex items-center gap-4 flex-wrap">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><ClipboardList className="w-7 h-7 text-white" /></div>
          <div className="flex-1 min-w-48">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Registru Frecvență</h1>
            <p className="text-amber-100 text-sm font-medium mt-0.5">{students.length} elevi{role === 'teacher' ? ' · ai tăi' : ''}</p>
          </div>
          <a href={exportUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary"><Download className="w-4 h-4" /> Export CSV</Button>
          </a>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
        {/* ── Month nav + teacher filter ── */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => setMonthRef(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white min-w-48 text-center">{monthLabel}</span>
          <button onClick={() => setMonthRef(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
          <button onClick={() => setMonthRef(new Date())} className="px-4 py-2 text-sm font-bold rounded-xl bg-amber-600 text-white shadow-md hover:bg-amber-500">Luna curentă</button>
          {role === 'admin' && (
            <div className="w-48"><Select value={fTeacher} onChange={e => setFTeacher(e.target.value)} placeholder="Toți profesorii" options={teachers.map(t => ({ value: t.id, label: t.name }))} /></div>
          )}
        </div>

        {/* ── Service / discipline picker ── */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setFDiscipline('')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors
              ${fDiscipline === '' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-300'}`}
          >
            Toate serviciile
          </button>
          {INSTRUMENTS.map(i => (
            <button
              key={i}
              onClick={() => setFDiscipline(i)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors
                ${fDiscipline === i ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-300'}`}
            >
              {i}
            </button>
          ))}
        </div>

        {/* ── Excel-style register grid ── */}
        <div className="flex-1 overflow-auto rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-slate-900 shadow-sm">
          <table className="border-collapse text-base" style={{ minWidth: 200 + days.length * 56 }}>
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 px-4 py-3 text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 text-left" style={{ minWidth: 200, width: 200 }}>
                  Elev
                </th>
                {days.map(d => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = fmtDate(d) === fmtDate(new Date());
                  return (
                    <th key={d.getDate()} className={`sticky top-0 z-10 border border-amber-200 dark:border-amber-900/40 px-1 py-2.5 text-center font-semibold
                      ${isToday ? 'bg-amber-200 dark:bg-amber-800/60' : isWeekend ? 'bg-amber-100/70 dark:bg-amber-900/30' : 'bg-amber-50 dark:bg-amber-950/40'}`} style={{ minWidth: 56, width: 56 }}>
                      <div className="text-[10px] uppercase tracking-wide text-amber-700/70 dark:text-amber-400/70">{WEEKDAY_LETTERS[d.getDay()]}</div>
                      <div className="text-sm text-amber-900 dark:text-amber-200">{d.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={days.length + 1} className="text-center py-10 text-slate-400">Niciun elev</td></tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-base font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {s.name}
                  </td>
                  {days.map(d => {
                    const dateStr = fmtDate(d);
                    const key = `${s.id}|${dateStr}`;
                    const cellLessons = byCell[key] ?? [];
                    const primary = cellLessons[0];
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const isMenu = activeCell === key;
                    const sym = primary ? symbolFor(primary) : null;
                    return (
                      <td key={dateStr} className={`relative border border-slate-200 dark:border-slate-800 p-0 text-center ${isWeekend ? 'bg-slate-50/70 dark:bg-slate-800/30' : ''}`}>
                        <button
                          onClick={e => { e.stopPropagation(); openCell(s, dateStr, cellLessons); }}
                          disabled={!canEdit && cellLessons.length === 0}
                          title={sym?.title}
                          className={`w-full h-12 flex items-center justify-center text-lg font-bold transition-colors
                            ${sym ? sym.className : ''} ${canEdit ? 'hover:brightness-95 cursor-pointer' : cellLessons.length ? 'cursor-default' : 'cursor-default'}
                            ${isMenu ? 'ring-2 ring-amber-400 ring-inset' : ''}`}
                        >
                          {savingCell === key ? '…' : (sym?.char ?? '')}
                        </button>

                        {isMenu && cellLessons.length > 0 && (
                          <div onClick={e => e.stopPropagation()} className="absolute z-30 left-1/2 -translate-x-1/2 top-full mt-1 w-56 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 text-left animate-fade-in">
                            {cellLessons.map(l => (
                              <div key={l.id} className="mb-2 last:mb-0">
                                <div className="flex items-center justify-between mb-1.5 px-0.5">
                                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                                    {l.time?.slice(0, 5)} · {l.discipline ?? '—'} · {l.teacher_name}
                                  </p>
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <button onClick={() => { setEditLesson(l); setActiveCell(null); }} className="p-1 rounded-md text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30"><Pencil className="w-3 h-3" /></button>
                                    <button onClick={() => { setDeleteTarget(l); setActiveCell(null); }} className="p-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-5 gap-1">
                                  {MARK_OPTIONS.map(opt => (
                                    <button
                                      key={opt.mark}
                                      onClick={() => setMark(l, opt.mark)}
                                      title={opt.label}
                                      className={`h-7 rounded-md border text-xs font-bold flex items-center justify-center transition-colors ${opt.className}`}
                                    >
                                      {opt.char}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pb-1">
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center border border-emerald-200">✓</span>Prezent / Finalizată</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 font-bold flex items-center justify-center border border-amber-200">M</span>Absență motivată</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-md bg-rose-50 text-rose-700 font-bold flex items-center justify-center border border-rose-200">N</span>Absență nemotivată</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-md bg-red-50 text-red-700 font-bold flex items-center justify-center border border-red-200">X</span>Anulată</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-md bg-sky-50 text-sky-700 font-bold flex items-center justify-center border border-sky-200">R</span>Recuperare</span>
          {canEdit && <span className="ml-auto text-[11px] opacity-60 italic hidden sm:inline">Click pe o celulă goală adaugă o lecție · click pe un marcaj îl schimbă</span>}
        </div>
      </main>

      <LessonForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => mutateLessons()}
        defaultStudentId={addStudentId}
        defaultDate={addDate}
        defaultTeacherId={effectiveTeacherId ?? undefined}
        defaultDiscipline={fDiscipline || undefined}
        showToast={toast}
      />
      <LessonForm
        open={!!editLesson}
        onClose={() => setEditLesson(null)}
        onSaved={() => mutateLessons()}
        lesson={editLesson}
        showToast={toast}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge lecția" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Șterge lecția cu <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.student_name}</strong>
          {deleteTarget && <> din {deleteTarget.date} la {deleteTarget.time?.slice(0, 5)}</>}?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Anulează</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Se șterge…' : 'Șterge'}</Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
