'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useSWR from 'swr';
import { ClipboardList, ChevronLeft, ChevronRight, Pencil, Trash2, MessageSquare, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LessonForm from '@/components/lessons/LessonForm';
import PageBanner from '@/components/ui/PageBanner';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Lesson, Student, Teacher, INSTRUMENTS } from '@/lib/types';
import { DEFAULT_TIME_SLOTS } from '@/lib/timeSlots';
import { localDateStr } from '@/lib/dates';
import { symbolsForLesson, markForLesson, nextState, type Mark, type MarkAction, type Sym } from '@/lib/attendanceMarks';
import { inRegister, pickInstrument } from '@/lib/rosters';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const DEFAULT_SLOT = DEFAULT_TIME_SLOTS[0];

const WEEKDAY_LETTERS = ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S']; // 0=Sun..6=Sat

function fmtDate(d: Date) {
  return localDateStr(d);
}

function daysInMonth(ref: Date): Date[] {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => new Date(year, month, i + 1));
}

// 'cancelled' is deliberately not offered as a mark — a lesson's outcome is
// always either an attendance (present/motivated/unmotivated), a recovery or
// a replacement. baseSymbolFor() below still renders old 'cancelled' rows for
// historical data, it just can no longer be created going forward.
const MARK_OPTIONS: { mark: Mark; char: string; label: string; className: string }[] = [
  { mark: 'present',           char: '✓', label: 'Prezent / Finalizată',   className: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
  { mark: 'excused_absence',   char: 'M', label: 'Absență motivată',       className: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200' },
  { mark: 'unexcused_absence', char: 'N', label: 'Absență nemotivată',     className: 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200' },
  { mark: 'recovered',         char: 'R', label: 'Recuperare',             className: 'text-sky-700 bg-sky-50 hover:bg-sky-100 border-sky-200' },
  { mark: 'replacement',       char: 'I', label: 'Înlocuire (alt profesor)', className: 'text-violet-700 bg-violet-50 hover:bg-violet-100 border-violet-200' },
];

/** All symbols for every lesson in a day's cell, e.g. two lessons -> "M/N", one replaced+absent -> "M/I". */
function symbolsForCell(lessons: Lesson[]): Sym[] {
  return lessons.flatMap(symbolsForLesson);
}

/** A lesson that exists, or an empty cell (student + day) whose lesson gets created by the first mark. */
type MarkTarget = Lesson | { studentId: number; date: string; extra?: boolean };

let tempIdCounter = 0;
const nowMs = () => Date.now();

export default function AttendanceRegisterPage() {
  const [role, setRole] = useState<string | null>(null);
  const [myTeacherId, setMyTeacherId] = useState<number | null>(null);
  useEffect(() => {
    // Last known role first (so buttons work right after a refresh), then the real answer.
    try {
      const cached = JSON.parse(localStorage.getItem('arry-register-role') ?? 'null');
      if (cached) { setRole(cached.role ?? null); setMyTeacherId(cached.teacherId ?? null); }
    } catch { /* no cache */ }
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setRole(d.user?.role ?? null); setMyTeacherId(d.user?.teacher_id ?? null);
      try { localStorage.setItem('arry-register-role', JSON.stringify({ role: d.user?.role ?? null, teacherId: d.user?.teacher_id ?? null })); } catch { /* ignore */ }
    }).catch(() => {});
  }, []);
  const canEdit = role === 'admin' || role === 'administrator' || role === 'teacher';
  const isFullAdmin = role === 'admin' || role === 'administrator';

  const { toasts, toast, remove } = useToast();
  const [monthRef, setMonthRef] = useState(new Date());
  const [fTeacher, setFTeacher] = useState('');
  const [fDiscipline, setFDiscipline] = useState('');
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  // When set, the popover shows a teacher picker for "who did the replacement".
  const [replacingFor, setReplacingFor] = useState<MarkTarget | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<number | null>(null);
  // Cell already has ≥1 lesson marked, but the popover shows "add another
  // lesson" (e.g. a second instrument that day) instead of just re-marking
  // the existing one(s).
  const [addingAnother, setAddingAnother] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close the popover on any click/touch outside it — the popover is portaled
  // to document.body, so React's synthetic-event bubbling through the JSX
  // tree can't be relied on here; a real outside-click listener is needed.
  useEffect(() => {
    if (activeCell === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (popoverRef.current?.contains(target)) return;
      if (target.closest('[data-cell-trigger]')) return;
      setActiveCell(null);
      setPopoverPos(null);
      setReplacingFor(null);
      setAddingAnother(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeCell]);

  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);

  const days = daysInMonth(monthRef);
  const from = fmtDate(days[0]);
  const to = fmtDate(days[days.length - 1]);
  const monthKey = (d: Date) => {
    const ds = daysInMonth(d);
    return `/api/lessons?from=${fmtDate(ds[0])}&to=${fmtDate(ds[ds.length - 1])}`;
  };
  const lessonsKey = monthKey(monthRef);

  // Instant paint after a refresh: show what was on screen last time straight away
  // (from this browser), while the fresh data loads and replaces it.
  const [seed, setSeed] = useState<Record<string, unknown>>({});
  useEffect(() => {
    try { setSeed(JSON.parse(localStorage.getItem('arry-register-cache') ?? '{}')); } catch { /* no cache yet */ }
  }, []);

  const { data: studentsData } = useSWR('/api/students', fetcher, { fallbackData: seed['/api/students'] as never });
  const { data: teachersData } = useSWR('/api/teachers', fetcher, { fallbackData: seed['/api/teachers'] as never });
  const { data: lessonsData, mutate: mutateLessons } = useSWR(lessonsKey, fetcher, { fallbackData: seed[lessonsKey] as never, keepPreviousData: false });
  const { data: disciplineTeachersData, mutate: mutateDisciplineTeachers } = useSWR('/api/discipline-teachers', fetcher, { fallbackData: seed['/api/discipline-teachers'] as never });
  // Warm the neighbouring months so switching month is instant too.
  useSWR(monthKey(new Date(monthRef.getFullYear(), monthRef.getMonth() - 1, 1)), fetcher);
  useSWR(monthKey(new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 1)), fetcher);

  useEffect(() => {
    if (!studentsData || !teachersData || !lessonsData) return;
    try {
      const prev = JSON.parse(localStorage.getItem('arry-register-cache') ?? '{}');
      const lessonKeys = Object.keys(prev).filter(k => k.startsWith('/api/lessons')).filter(k => k !== lessonsKey).slice(-2);
      const next: Record<string, unknown> = { '/api/students': studentsData, '/api/teachers': teachersData, '/api/discipline-teachers': disciplineTeachersData, [lessonsKey]: lessonsData };
      for (const k of lessonKeys) next[k] = prev[k];
      localStorage.setItem('arry-register-cache', JSON.stringify(next));
    } catch { /* storage full or unavailable — the cache is only a speed-up */ }
  }, [studentsData, teachersData, lessonsData, disciplineTeachersData, lessonsKey]);

  const allStudents: Student[] = studentsData?.students ?? [];
  const teachers: Teacher[] = teachersData?.teachers ?? [];
  const teacherName = (tid: number | null | undefined) => teachers.find(t => t.id === tid)?.name ?? null;
  const allLessons: Lesson[] = ((lessonsData?.lessons ?? []) as Lesson[]).map(l => ({
    ...l,
    replacement_teacher_name: l.replacement_teacher_id ? (l.replacement_teacher_name ?? teacherName(l.replacement_teacher_id)) : null,
  }));
  const disciplineTeachers: { discipline: string; teacher_id: number | null; teacher_name: string | null }[] = disciplineTeachersData?.assignments ?? [];

  const monthLessons = allLessons.filter(l => l.date >= from && l.date <= to);

  const disciplineTeacherAssignment = fDiscipline ? disciplineTeachers.find(a => a.discipline === fDiscipline) : undefined;
  // Admin filtering: an explicit pick from "Toți profesorii" (in the table
  // header, above Elev) wins; otherwise, when a discipline tab is selected,
  // fall back to that discipline's assigned teacher. Either way, matching
  // resolves each student's teacher for the SPECIFIC instrument (from their
  // per-instrument subscription) rather than just their primary teacher_id.
  const effectiveTeacherId = role === 'teacher'
    ? myTeacherId
    : (fTeacher ? Number(fTeacher) : (fDiscipline ? (disciplineTeacherAssignment?.teacher_id ?? null) : null));

  // Strict roster: only students actually enrolled (per-instrument subscription
  // and its teacher), active, and never paused/inactive ones — see lib/rosters.ts.
  const students = allStudents.filter(s => inRegister(s, fDiscipline, effectiveTeacherId));

  const byCell: Record<string, Lesson[]> = {};
  for (const l of monthLessons) {
    if (fDiscipline && l.discipline !== fDiscipline) continue;
    // A teacher filter must only surface lessons that teacher actually
    // teaches (or substituted into) — not every lesson of a student who
    // also happens to study a different instrument with someone else.
    // A replaced lesson stays visible for the student's own teacher (it's their
    // student's row) as well as for the teacher who covered it.
    if (effectiveTeacherId) {
      if (l.teacher_id !== effectiveTeacherId && l.replacement_teacher_id !== effectiveTeacherId) continue;
    }
    const key = `${l.student_id}|${l.date}`;
    (byCell[key] ??= []).push(l);
  }
  // Same order on screen and after every save: by time, then instrument, then id.
  const cellOrder = (a: Lesson, b: Lesson) =>
    (a.time ?? '').slice(0, 5).localeCompare((b.time ?? '').slice(0, 5)) || (a.discipline ?? '').localeCompare(b.discipline ?? '') || a.id - b.id;
  // Safety net: two rows for the same student/day/instrument/time are the same
  // lesson (left over from a double-click) — show one, preferring the marked
  // and newest, so a single marking never renders as "M/M".
  for (const key of Object.keys(byCell)) {
    const best = new Map<string, Lesson>();
    for (const l of byCell[key]) {
      const k = `${l.discipline ?? ''}|${(l.time ?? '').slice(0, 5)}`;
      const cur = best.get(k);
      const marked = (x: Lesson) => (markForLesson(x) || x.replacement_teacher_id ? 1 : 0);
      if (!cur || marked(l) > marked(cur) || (marked(l) === marked(cur) && l.id > cur.id)) best.set(k, l);
    }
    byCell[key] = Array.from(best.values()).sort(cellOrder);
  }

  const monthLabel = (() => {
    const s = monthRef.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  // ── Marking: instant on screen, one atomic call to the server ──────────────
  // The mark is applied to the lesson list in the browser immediately; the server
  // call (/api/register/mark: find-or-create the lesson + save the mark) runs in
  // the background, one at a time per cell so quick clicks stay in order and a
  // lesson can never be created twice. If the server refuses, the screen goes
  // back to the saved truth and the error is shown.
  const patchLessons = (fn: (ls: Lesson[]) => Lesson[]) =>
    mutateLessons((cur: { lessons: Lesson[] } | undefined) => ({ lessons: fn(cur?.lessons ?? []) }), { revalidate: false });

  const applyLocal = (l: Lesson, action: MarkAction, replacementId?: number | null): Lesson => {
    const st = nextState({ status: l.status, attendance_status: l.attendance_status ?? null, replacement_teacher_id: l.replacement_teacher_id ?? null }, action, replacementId);
    return {
      ...l,
      status: st.status as Lesson['status'],
      attendance_status: st.attendance_status as Lesson['attendance_status'],
      replacement_teacher_id: st.replacement_teacher_id,
      replacement_teacher_name: st.replacement_teacher_id ? teacherName(st.replacement_teacher_id) : null,
    };
  };

  const cellQueues = useRef(new Map<string, Promise<void>>());
  const cellPending = useRef(new Map<string, number>());
  const tempToReal = useRef(new Map<number, number>());
  const lastExtra = useRef(new Map<string, number>());

  const runMark = (target: MarkTarget, action: MarkAction, replacementId?: number | null) => {
    if (!canEdit) return;
    const existing = 'id' in target ? target : null;
    const studentId = existing ? existing.student_id : (target as { studentId: number }).studentId;
    const date = existing ? existing.date : (target as { date: string }).date;
    const extra = !existing && !!(target as { extra?: boolean }).extra;
    const cellKey = `${studentId}|${date}`;

    // A double click on "another lesson" must not create two.
    if (extra) {
      const now = nowMs();
      if (now - (lastExtra.current.get(cellKey) ?? 0) < 1500) return;
      lastExtra.current.set(cellKey, now);
    }

    // 1) instantly on screen
    let shownId: number;
    let chosenDiscipline: string | null = null;
    if (existing) {
      shownId = existing.id;
      patchLessons(ls => ls.map(l => l.id === existing.id ? applyLocal(l, action, replacementId) : l));
    } else {
      const student = allStudents.find(x => x.id === studentId);
      const subs = (student?.subscriptions ?? []).filter(x => (x.status ?? 'active') === 'active');
      const usedHere = (byCell[cellKey] ?? []).map(l => l.discipline ?? null);
      // The instrument THIS teacher teaches the student (not just their first instrument).
      const discipline = student
        ? pickInstrument(student, { discipline: fDiscipline, teacherId: effectiveTeacherId, taken: usedHere, extra })
        : null;
      chosenDiscipline = discipline;
      const sub = subs.find(x => x.instrument === discipline);
      const takenTimes = new Set((byCell[cellKey] ?? []).filter(l => (l.discipline ?? null) === discipline).map(l => (l.time ?? '').slice(0, 5)));
      const slot = DEFAULT_TIME_SLOTS.find(t => !takenTimes.has(t)) ?? DEFAULT_SLOT;
      shownId = -(++tempIdCounter);
      const placeholder: Lesson = {
        id: shownId, student_id: studentId, student_name: student?.name, teacher_id: sub?.teacher_id ?? student?.teacher_id ?? 0,
        teacher_name: sub?.teacher_name ?? student?.teacher_name ?? undefined, date, time: slot, duration: 45,
        status: 'scheduled', discipline,
      } as Lesson;
      patchLessons(ls => [...ls, applyLocal(placeholder, action, replacementId)]);
    }
    setActiveCell(null); setPopoverPos(null); setReplacingFor(null); setAddingAnother(false);

    // 2) in the background, in order for this cell
    cellPending.current.set(cellKey, (cellPending.current.get(cellKey) ?? 0) + 1);
    const task = async () => {
      let ok = false;
      try {
        const knownId = shownId > 0 ? shownId : tempToReal.current.get(shownId);
        const body = knownId
          ? { action, lesson_id: knownId, replacement_teacher_id: replacementId ?? undefined }
          : { action, student_id: studentId, date, extra, discipline: chosenDiscipline ?? undefined, replacement_teacher_id: replacementId ?? undefined };
        const res = await fetch('/api/register/mark', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.lesson) throw new Error(json.error ?? 'Eroare la salvare');
        const real = json.lesson as Lesson;
        if (shownId < 0) tempToReal.current.set(shownId, real.id);
        const stillPending = (cellPending.current.get(cellKey) ?? 1) > 1;
        // While more clicks on this cell are still queued, only fix the id — their
        // instant changes stay on screen; the last one brings the saved truth.
        patchLessons(ls => ls.map(l => l.id === shownId ? (stillPending ? { ...l, id: real.id } : { ...real, replacement_teacher_name: real.replacement_teacher_name ?? (real.replacement_teacher_id ? teacherName(real.replacement_teacher_id) : null) } as Lesson) : l));
        ok = true;
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Eroare la salvare', 'error');
      } finally {
        cellPending.current.set(cellKey, (cellPending.current.get(cellKey) ?? 1) - 1);
        if (!ok || (cellPending.current.get(cellKey) ?? 0) === 0) mutateLessons();
      }
    };
    const prev = cellQueues.current.get(cellKey) ?? Promise.resolve();
    cellQueues.current.set(cellKey, prev.then(task));
  };

  /** Pressing a button: "I" first asks who replaced; every other letter applies right away. */
  const setMark = (target: MarkTarget, mark: Mark) => {
    if (mark === 'replacement') { setReplacingFor(target); return; }
    runMark(target, mark);
  };

  const saveNote = async (lesson: Lesson) => {
    const text = (noteDrafts[lesson.id] ?? lesson.attendance_notes ?? '').trim();
    setSavingNoteId(lesson.id);
    try {
      const res = await fetch('/api/attendance', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lesson.id, status: lesson.attendance_status ?? 'present', notes: text || null }),
      });
      if (res.ok) { toast('Comentariu salvat', 'success'); mutateLessons(); }
      else { const d = await res.json().catch(() => ({})); toast(d.error ?? 'Eroare la salvare', 'error'); }
    } finally {
      setSavingNoteId(null);
    }
  };

  const setDisciplineTeacher = async (discipline: string, teacherId: string) => {
    const res = await fetch('/api/discipline-teachers', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discipline, teacher_id: teacherId || null }),
    });
    if (res.ok) { toast('Profesor actualizat', 'success'); mutateDisciplineTeachers(); }
    else { const d = await res.json().catch(() => ({})); toast(d.error ?? 'Eroare la salvare', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    patchLessons(ls => ls.filter(l => l.id !== target.id));
    const res = await fetch(`/api/lessons/${target.id}`, { method: 'DELETE' }).catch(() => null);
    if (res?.ok) toast('Lecție ștearsă', 'success');
    else { const d = await res?.json().catch(() => ({})); toast(d?.error ?? 'Eroare la ștergere', 'error'); }
    mutateLessons();
  };

  const openCell = (dateStr: string, cellLessons: Lesson[], studentId: number, x: number, y: number) => {
    if (!canEdit) {
      toast(role === null ? 'Se încarcă permisiunile… mai încearcă o dată în o clipă' : 'Nu ai permisiunea de a edita registrul', 'error');
      return;
    }
    const key = `${studentId}|${dateStr}`;
    setReplacingFor(null);
    setAddingAnother(false);
    if (activeCell === key) {
      setActiveCell(null);
      setPopoverPos(null);
      return;
    }
    // Positioned right next to the mouse cursor (click point), not the cell —
    // clamped so it always stays fully on-screen.
    const popoverWidth = 256;
    const desiredHeight = 340; // rough upper bound — the popover scrolls internally if it still doesn't fit
    const left = Math.min(Math.max(8, x - popoverWidth / 2), window.innerWidth - popoverWidth - 8);
    const spaceBelow = window.innerHeight - y - 16;
    const spaceAbove = y - 12;
    // Prefer opening below the cursor; flip above it when there isn't enough
    // room below (e.g. clicking near the bottom of the screen) but there is above.
    const openAbove = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(desiredHeight, openAbove ? spaceAbove : spaceBelow));
    const top = openAbove ? Math.max(8, y - maxHeight - 8) : y + 12;
    setPopoverPos({ top, left, maxHeight });
    setActiveCell(key);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageBanner
        icon={ClipboardList}
        title="Registru Frecvență"
        subtitle={`${students.length} elevi${role === 'teacher' ? ' · ai tăi' : ''}`}
        accent="#E08A3C"
      />

      <main className="flex-1 min-h-0 overflow-hidden flex flex-col p-4 gap-4 bg-slate-200 dark:bg-slate-950">
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

        {/* ── Excel-style register grid — deliberately always white/black,
              independent of theme, so it reads like a printed register. ── */}
        <div className="flex-1 min-h-0 overflow-auto rounded-2xl border-2 border-black bg-white shadow-sm">
          <table className="border-collapse text-base w-full" style={{ minWidth: 190 + days.length * 46 }}>
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 bg-white border border-black px-3 py-2.5 text-left align-bottom" style={{ minWidth: 190, width: 190 }}>
                  {isFullAdmin && (
                    <div className="flex flex-col gap-0.5 mb-2 p-2 rounded-lg bg-white border-2 border-slate-300 shadow-sm normal-case">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Filtru profesor</span>
                      <select
                        value={fTeacher}
                        onChange={e => setFTeacher(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-700 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-slate-400 rounded-md -ml-0.5"
                      >
                        <option value="">Toți profesorii</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  )}
                  {fDiscipline ? (
                    <div className="flex flex-col gap-0.5 mb-2 p-2 rounded-lg bg-white border-2 border-amber-400 shadow-sm normal-case">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">{fDiscipline}</span>
                      {isFullAdmin ? (
                        <select
                          value={disciplineTeacherAssignment?.teacher_id ?? ''}
                          onChange={e => setDisciplineTeacher(fDiscipline, e.target.value)}
                          className="w-full text-xs font-semibold text-slate-700 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-amber-400 rounded-md -ml-0.5"
                        >
                          <option value="">— fără profesor —</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs font-semibold text-slate-700">{disciplineTeacherAssignment?.teacher_name ?? '—'}</span>
                      )}
                    </div>
                  ) : null}
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-900">Elev</span>
                </th>
                {days.map(d => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = fmtDate(d) === fmtDate(new Date());
                  return (
                    <th key={d.getDate()} className="sticky top-0 z-10 border border-black px-1 py-2.5 text-center font-semibold bg-white" style={{ minWidth: 46, width: 46 }}>
                      <div className={`text-[10px] uppercase tracking-wide leading-none ${isWeekend ? 'text-red-500' : 'text-slate-500'}`}>{WEEKDAY_LETTERS[d.getDay()]}</div>
                      <div className={`text-sm leading-tight mt-0.5 ${isToday ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-extrabold' : 'text-slate-900'}`}>{d.getDate()}</div>
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
                  <td className="sticky left-0 z-10 bg-white border border-black px-3 py-2 text-sm font-medium text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis" style={{ maxWidth: 190 }}>
                    {s.name}
                  </td>
                  {days.map(d => {
                    const dateStr = fmtDate(d);
                    const key = `${s.id}|${dateStr}`;
                    const cellLessons = byCell[key] ?? [];
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const isMenu = activeCell === key;
                    const syms = cellLessons.length > 0 ? symbolsForCell(cellLessons) : [];
                    const isSingle = syms.length === 1;
                    const displayChar = syms.map(sy => sy.char).join('/');
                    const cellClassName = isSingle ? syms[0].className : (syms.length > 1 ? 'text-slate-700 bg-slate-100' : 'text-slate-200');
                    const combinedTitle = syms.length > 0
                      ? syms.map(sy => sy.title).join(' · ') + (cellLessons.some(l => l.attendance_notes) ? ` — ${cellLessons.map(l => l.attendance_notes).filter(Boolean).join('; ')}` : '')
                      : 'Click pentru a marca situația';
                    return (
                      <td key={dateStr} className={`relative border border-black p-0 text-center ${isWeekend ? 'bg-slate-50' : 'bg-white'}`}>
                        <button
                          onClick={e => { e.stopPropagation(); openCell(dateStr, cellLessons, s.id, e.clientX, e.clientY); }}
                          data-cell-trigger
                          title={combinedTitle}
                          className={`relative w-full h-11 flex items-center justify-center font-bold transition-colors
                            ${syms.length > 2 ? 'text-xs' : syms.length > 1 ? 'text-sm' : 'text-lg'}
                            ${cellClassName} ${canEdit ? 'hover:brightness-95 hover:bg-slate-100 cursor-pointer' : 'cursor-default'}
                            ${isMenu ? 'ring-2 ring-amber-400 ring-inset' : ''}`}
                        >
                          {displayChar || (canEdit ? '·' : '')}
                          {cellLessons.some(l => l.attendance_notes) && (
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                          )}
                        </button>

                        {isMenu && popoverPos && createPortal(
                          <div
                            ref={popoverRef}
                            onClick={e => e.stopPropagation()}
                            style={{ position: 'fixed', top: popoverPos.top, left: popoverPos.left, maxHeight: popoverPos.maxHeight, overflowY: 'auto' }}
                            className="z-50 w-64 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 text-left animate-fade-in"
                          >
                            {replacingFor ? (
                              <div className="p-1">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">Cine a făcut înlocuirea?</p>
                                <div className="max-h-52 overflow-auto flex flex-col gap-1">
                                  {teachers.map(tt => (
                                    <button key={tt.id}
                                      onClick={() => runMark(replacingFor, 'replacement', tt.id)}
                                      className="text-left px-2.5 py-1.5 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                                    >
                                      {tt.name}
                                    </button>
                                  ))}
                                </div>
                                <button onClick={() => setReplacingFor(null)} className="mt-1.5 text-[11px] text-slate-400 hover:text-slate-600 px-2">← înapoi</button>
                              </div>
                            ) : cellLessons.length === 0 ? (
                              <div className="p-1">
                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 px-0.5">
                                  Nicio lecție — alege situația (se creează o lecție):
                                </p>
                                <div className="grid grid-cols-3 gap-1">
                                  {MARK_OPTIONS.map(opt => (
                                    <button
                                      key={opt.mark}
                                      onClick={() => setMark({ studentId: s.id, date: dateStr }, opt.mark)}
                                      title={opt.label}
                                      className={`h-9 rounded-md border text-xs font-bold flex flex-col items-center justify-center leading-none gap-0.5 transition-colors ${opt.className}`}
                                    >
                                      <span className="text-sm">{opt.char}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : <>{cellLessons.map(l => (
                              <div key={l.id} className="mb-2.5 last:mb-0">
                                <div className="flex items-center justify-between mb-1.5 px-0.5">
                                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                                    {l.time?.slice(0, 5)} · {l.discipline ?? '—'} · {l.teacher_name}
                                    {l.replacement_teacher_name && <span className="text-violet-600 dark:text-violet-400"> · înloc. {l.replacement_teacher_name}</span>}
                                  </p>
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <button onClick={() => { setEditLesson(l); setActiveCell(null); }} className="p-1 rounded-md text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30"><Pencil className="w-3 h-3" /></button>
                                    <button onClick={() => { setDeleteTarget(l); setActiveCell(null); }} className="p-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-5 gap-1 mb-1.5">
                                  {MARK_OPTIONS.map(opt => {
                                    const isActive = opt.mark === 'replacement' ? !!l.replacement_teacher_id : opt.mark === markForLesson(l);
                                    return (
                                      <button
                                        key={opt.mark}
                                        onClick={() => setMark(l, opt.mark)}
                                        title={opt.label}
                                        className={`h-7 rounded-md border text-xs font-bold flex items-center justify-center transition-all ${opt.className}
                                          ${isActive ? 'ring-2 ring-current ring-offset-1 scale-110 shadow-md font-extrabold' : 'opacity-60 hover:opacity-100'}`}
                                      >
                                        {opt.char}
                                      </button>
                                    );
                                  })}
                                </div>
                                {l.replacement_teacher_id && (
                                  <button onClick={() => runMark(l, 'clear_replacement')}
                                    className="w-full mb-1.5 text-[11px] text-violet-600 dark:text-violet-400 hover:underline">
                                    Elimină înlocuirea ({l.replacement_teacher_name})
                                  </button>
                                )}
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                  <input
                                    value={noteDrafts[l.id] ?? l.attendance_notes ?? ''}
                                    onChange={e => setNoteDrafts(prev => ({ ...prev, [l.id]: e.target.value }))}
                                    onKeyDown={e => { if (e.key === 'Enter') saveNote(l); }}
                                    disabled={!l.attendance_status}
                                    placeholder={l.attendance_status ? 'Comentariu…' : 'Marchează întâi lecția'}
                                    className="flex-1 min-w-0 px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                  />
                                  <button
                                    onClick={() => saveNote(l)}
                                    disabled={savingNoteId === l.id}
                                    title="Salvează comentariu"
                                    className="p-1 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 disabled:opacity-50 flex-shrink-0"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {addingAnother ? (
                              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-700">
                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 px-0.5">
                                  Altă lecție — alege situația:
                                </p>
                                <div className="grid grid-cols-3 gap-1">
                                  {MARK_OPTIONS.map(opt => (
                                    <button
                                      key={opt.mark}
                                      onClick={() => { setAddingAnother(false); setMark({ studentId: s.id, date: dateStr, extra: true }, opt.mark); }}
                                      title={opt.label}
                                      className={`h-9 rounded-md border text-xs font-bold flex flex-col items-center justify-center leading-none gap-0.5 transition-colors ${opt.className}`}
                                    >
                                      <span className="text-sm">{opt.char}</span>
                                    </button>
                                  ))}
                                </div>
                                <button onClick={() => setAddingAnother(false)} className="mt-1.5 text-[11px] text-slate-400 hover:text-slate-600 px-2">← înapoi</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingAnother(true)}
                                className="w-full mt-1 flex items-center justify-center gap-1 py-1.5 rounded-md border border-dashed border-amber-300 text-amber-600 text-[11px] font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              >
                                + Adaugă altă lecție
                              </button>
                            )}
                            </>}
                          </div>,
                          document.body,
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
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 font-bold flex items-center justify-center border border-amber-200">M</span>Absență motivată (nefinalizată · credit luna următoare)</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-md bg-rose-50 text-rose-700 font-bold flex items-center justify-center border border-rose-200">N</span>Absență nemotivată (finalizată)</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-md bg-sky-50 text-sky-700 font-bold flex items-center justify-center border border-sky-200">R</span>Recuperare</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-md bg-violet-50 text-violet-700 font-bold flex items-center justify-center border border-violet-200">I</span>Înlocuire</span>
          {canEdit && <span className="ml-auto text-[11px] opacity-60 italic hidden sm:inline">Click pe orice căsuță pentru a marca situația</span>}
        </div>
      </main>

      <LessonForm
        open={!!editLesson}
        onClose={() => setEditLesson(null)}
        onSaved={() => mutateLessons()}
        lesson={editLesson}
        teacherLocked={!isFullAdmin}
        showToast={toast}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge lecția" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Șterge lecția cu <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.student_name}</strong>
          {deleteTarget && <> din {deleteTarget.date} la {deleteTarget.time?.slice(0, 5)}</>}?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Anulează</Button>
          <Button variant="danger" onClick={handleDelete}>Șterge</Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
