'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Pencil, Trash2, GripVertical, Search, Filter, X } from 'lucide-react';
import LessonForm from '@/components/lessons/LessonForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Lesson } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 – 22:00

const SHORT_DAYS = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];

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

function fmtDisplay(d: Date) {
  const s = d.toLocaleDateString('ro-RO', { month: 'long', day: 'numeric' });
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function getMonthDates(ref: Date): Date[] {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDay = new Date(firstDay);
  const dow = firstDay.getDay();
  startDay.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));
  const endDay = new Date(lastDay);
  const dowEnd = lastDay.getDay();
  endDay.setDate(lastDay.getDate() + (dowEnd === 0 ? 0 : 7 - dowEnd));
  const days: Date[] = [];
  const cur = new Date(startDay);
  while (cur <= endDay) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return days;
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-indigo-500/90 border-indigo-400 text-white',
  completed:  'bg-emerald-500/90 border-emerald-400 text-white',
  cancelled:  'bg-slate-400/60 border-slate-300 text-white line-through',
};

export default function SchedulePage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);
  const isStudent = role === 'student';

  const [reference, setReference] = useState(new Date());
  const [animDir, setAnimDir]     = useState<'left' | 'right' | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [addDate, setAddDate]     = useState('');
  const [addTime, setAddTime]     = useState('09:00');
  const [editLesson, setEditLesson]     = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [activeMenu, setActiveMenu]     = useState<number | null>(null);
  const [draggingId, setDraggingId]     = useState<number | null>(null);
  const [dropCell, setDropCell]         = useState<string | null>(null); // "date|hour"
  const [burstId, setBurstId]           = useState<number | null>(null); // cancel burst anim
  const [searchStudent, setSearchStudent] = useState('');
  const [statusFilterSched, setStatusFilterSched] = useState('');
  const [view, setView] = useState<'week' | 'month'>('week');
  const { toasts, toast, remove } = useToast();

  const weekDates  = getWeekDates(reference);
  const from       = fmtDate(weekDates[0]);
  const to         = fmtDate(weekDates[6]);
  const monthDates = getMonthDates(reference);
  const monthFrom  = fmtDate(monthDates[0]);
  const monthTo    = fmtDate(monthDates[monthDates.length - 1]);
  const rangeFrom  = view === 'week' ? from : monthFrom;
  const rangeTo    = view === 'week' ? to   : monthTo;

  const { data: allData, mutate } = useSWR('/api/lessons', fetcher);
  const allLessons: Lesson[] = allData?.lessons ?? [];
  const lessons = allLessons
    .filter((l: Lesson) => l.date >= rangeFrom && l.date <= rangeTo)
    .filter((l: Lesson) => !searchStudent || (l.student_name ?? '').toLowerCase().includes(searchStudent.toLowerCase()))
    .filter((l: Lesson) => !statusFilterSched || l.status === statusFilterSched);

  const grid: Record<number, Record<number, Lesson[]>> = {};
  for (const l of lessons) {
    const d = new Date(l.date + 'T00:00:00');
    const dayIdx = d.getDay();
    const hour = parseInt(l.time?.split(':')[0] ?? '9');
    if (!grid[dayIdx]) grid[dayIdx] = {};
    if (!grid[dayIdx][hour]) grid[dayIdx][hour] = [];
    grid[dayIdx][hour].push(l);
  }

  const navigate = (dir: 'prev' | 'next') => {
    setAnimDir(dir === 'prev' ? 'right' : 'left');
    setTimeout(() => {
      const d = new Date(reference);
      if (view === 'week') {
        d.setDate(d.getDate() + (dir === 'prev' ? -7 : 7));
      } else {
        d.setMonth(d.getMonth() + (dir === 'prev' ? -1 : 1));
      }
      setReference(d);
      setAnimDir(null);
    }, 180);
  };

  const goToday = () => {
    setAnimDir('right');
    setTimeout(() => { setReference(new Date()); setAnimDir(null); }, 180);
  };

  const openAddLesson = (date: string, hour: number) => {
    setAddDate(date);
    setAddTime(`${pad2(hour)}:00`);
    setShowForm(true);
  };

  // ── Drag & drop ───────────────────────────────────────────
  const handleDrop = async (date: string, hour: number) => {
    const id = draggingId;
    setDraggingId(null);
    setDropCell(null);
    if (!id) return;
    const lesson = allLessons.find(l => l.id === id);
    if (!lesson) return;
    const newTime = `${pad2(hour)}:00`;
    if (lesson.date === date && lesson.time?.slice(0, 5) === newTime) return;

    // Optimistic update
    mutate(
      { lessons: allLessons.map(l => l.id === id ? { ...l, date, time: newTime } : l) },
      false,
    );

    const res = await fetch(`/api/lessons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time: newTime }),
    });
    if (!res.ok) {
      toast('Eroare la mutare', 'error');
      mutate();
    } else {
      toast('Lecție mutată', 'success');
      mutate();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/lessons/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast('Lecție ștearsă', 'success'); mutate(); }
      else toast('Eroare la ștergere', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const todayStr    = fmtDate(new Date());
  const weekLabel   = `${fmtDisplay(weekDates[0])} – ${fmtDisplay(weekDates[6])} ${weekDates[0].getFullYear()}`;
  const rawMonth    = reference.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  const monthLabel  = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
  const navLabel    = view === 'week' ? weekLabel : monthLabel;
  const navSubLabel = view === 'week' ? 'Săptămâna' : 'Luna';
  const totalWeek   = lessons.length;
  const scheduled = lessons.filter(l => l.status === 'scheduled').length;
  const completed = lessons.filter(l => l.status === 'completed').length;
  const cancelled = lessons.filter(l => l.status === 'cancelled').length;

  return (
    <div className="flex flex-col flex-1" onClick={() => activeMenu !== null && setActiveMenu(null)}>

      {/* ── Animated Banner ───────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Program {view === 'week' ? 'săptămânal' : 'lunar'}</h1>
            <p className="text-indigo-200 text-sm font-medium mt-0.5">{isStudent ? `Vizualizează lecțiile tale${view === 'week' ? ' din această săptămână' : ' din această lună'}` : `Gestionează lecțiile${view === 'week' ? ' din această săptămână' : ' din această lună'}`}</p>
          </div>
          <div className="ml-auto hidden sm:flex gap-3">
            <StatBadge label="Total"      value={totalWeek} color="bg-white/20 text-white" />
            <StatBadge label="Programate" value={scheduled} color="bg-indigo-300/30 text-white" />
            <StatBadge label="Finalizate" value={completed} color="bg-emerald-300/30 text-white" />
            {cancelled > 0 && <StatBadge label="Anulate" value={cancelled} color="bg-red-300/30 text-white" />}
          </div>
        </div>
      </div>

      {/* ── Mobile stats ─────────────────────────────────── */}
      <div className="flex sm:hidden gap-3 px-4 pt-4">
        <MobileStat label="Total"  value={totalWeek} color="bg-slate-800 text-white" />
        <MobileStat label="Prog."  value={scheduled} color="bg-indigo-600 text-white" />
        <MobileStat label="Fin."   value={completed}  color="bg-emerald-600 text-white" />
      </div>

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">

        {/* ── Week navigation ──────────────────────────────── */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('prev')}
            className="group flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200 hover:scale-110 active:scale-95"
            title="Săptămâna anterioară"
          >
            <ChevronLeft className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" />
          </button>

          <div
            className="flex flex-col items-center min-w-72 select-none transition-all duration-200"
            style={{
              opacity: animDir ? 0 : 1,
              transform: animDir === 'left' ? 'translateX(-20px) scale(0.97)' : animDir === 'right' ? 'translateX(20px) scale(0.97)' : 'translateX(0) scale(1)',
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-0.5">
              {navSubLabel}
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {navLabel}
            </span>
          </div>

          <button
            onClick={() => navigate('next')}
            className="group flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200 hover:scale-110 active:scale-95"
            title="Săptămâna următoare"
          >
            <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" />
          </button>

          <button
            onClick={goToday}
            className="ml-1 px-5 py-2 text-sm font-bold rounded-2xl bg-indigo-600 text-white shadow-md hover:bg-indigo-500 hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Azi
          </button>
          <div className="flex ml-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-semibold transition-colors duration-150 ${view === 'week' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Săptămânal
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 text-sm font-semibold transition-colors duration-150 ${view === 'month' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Lunar
            </button>
          </div>
        </div>

        {/* ── Search / filter toolbar ──────────────────────── */}
        {!isStudent && <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={searchStudent}
              onChange={e => setSearchStudent(e.target.value)}
              placeholder="Caută elev în program…"
              className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800
                text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                transition-shadow duration-200"
            />
            {searchStudent && (
              <button
                onClick={() => setSearchStudent('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Status</span>
            </div>
            {[
              { value: '', label: 'Toate', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
              { value: 'scheduled', label: 'Programate', color: statusFilterSched === 'scheduled' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
              { value: 'completed', label: 'Finalizate', color: statusFilterSched === 'completed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
              { value: 'cancelled', label: 'Anulate', color: statusFilterSched === 'cancelled' ? 'bg-slate-500 text-white border-slate-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilterSched(opt.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 ${opt.value === statusFilterSched || (opt.value === '' && statusFilterSched === '') ? (opt.value === '' ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:border-slate-200' : opt.color) : opt.color} hover:opacity-80`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {lessons.length} lecții
          </span>
        </div>}

        {/* ── Calendar grid ────────────────────────────────── */}
        {view === 'month' ? (
          <MonthCalendar
            monthDates={monthDates}
            allLessons={allLessons}
            searchStudent={isStudent ? '' : searchStudent}
            statusFilter={isStudent ? '' : statusFilterSched}
            todayStr={todayStr}
            reference={reference}
            isStudent={isStudent}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            openAddLesson={openAddLesson}
            setEditLesson={setEditLesson}
            setDeleteTarget={setDeleteTarget}
            animDir={animDir}
          />
        ) : (
        <div
          className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
          style={{
            opacity: animDir ? 0 : 1,
            transform: animDir === 'left' ? 'translateX(-12px)' : animDir === 'right' ? 'translateX(12px)' : 'translateX(0)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          <div className="min-w-[820px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
              <div className="py-4" />
              {weekDates.map((d, i) => {
                const isToday = fmtDate(d) === todayStr;
                return (
                  <div key={i} className={`py-4 text-center border-l border-slate-200 dark:border-slate-700 ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}`}>
                      {SHORT_DAYS[d.getDay()]}
                    </p>
                    <div className={`mt-1.5 mx-auto w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-200'}`}>
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hour rows */}
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-800" style={{ minHeight: '80px' }}>
                <div className="py-3 px-3 text-xs font-mono text-slate-400 text-right pt-3 border-r border-slate-100 dark:border-slate-800 select-none">
                  {pad2(hour)}:00
                </div>
                {weekDates.map((d, di) => {
                  const dayIdx = d.getDay();
                  const cells: Lesson[] = grid[dayIdx]?.[hour] ?? [];
                  const isToday = fmtDate(d) === todayStr;
                  const dateStr = fmtDate(d);
                  const cellKey = `${dateStr}|${hour}`;
                  const isDropTarget = dropCell === cellKey && draggingId !== null;
                  return (
                    <div
                      key={di}
                      onDragOver={e => {
                        if (isStudent || draggingId === null) return;
                        e.preventDefault();
                        if (dropCell !== cellKey) setDropCell(cellKey);
                      }}
                      onDragLeave={() => { if (dropCell === cellKey) setDropCell(null); }}
                      onDrop={e => { if (isStudent) return; e.preventDefault(); handleDrop(dateStr, hour); }}
                      className={`group relative border-l border-slate-100 dark:border-slate-800 p-1.5 flex flex-col gap-1 transition-all duration-150 hover:z-40
                        ${isToday ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}
                        ${isDropTarget
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-400 ring-inset scale-[0.99]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                    >
                      {cells.map(l => {
                        const isDragging = draggingId === l.id;
                        const isMenu     = activeMenu === l.id;
                        return (
                          <div
                            key={l.id}
                            draggable={!isStudent}
                            onDragStart={isStudent ? undefined : e => {
                              setDraggingId(l.id);
                              setActiveMenu(null);
                              e.dataTransfer.effectAllowed = 'move';
                              try { e.dataTransfer.setData('text/plain', String(l.id)); } catch {}
                            }}
                            onDragEnd={isStudent ? undefined : () => { setDraggingId(null); setDropCell(null); }}
                            onClick={isStudent ? undefined : e => { e.stopPropagation(); setActiveMenu(isMenu ? null : l.id); }}
                            className={`peer/lesson relative text-xs px-2 py-1.5 rounded-lg border select-none ${isStudent ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
                              transition-all duration-200 will-change-transform
                              ${STATUS_COLOR[l.status] ?? STATUS_COLOR.scheduled}
                              ${isDragging ? 'opacity-40 scale-95 rotate-1' : 'hover:scale-[1.03] hover:shadow-lg hover:-translate-y-0.5'}
                              ${isMenu ? 'ring-2 ring-white/80 shadow-xl scale-[1.02]' : ''}`}
                          >
                            <div className="flex items-start gap-1">
                              <GripVertical className="w-3 h-3 mt-0.5 opacity-50 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold truncate">{l.student_name}</p>
                                <p className="opacity-75 truncate text-[10px] mt-0.5">{l.time?.slice(0, 5)} · {l.duration}min</p>
                              </div>
                              {/* Status buttons - hidden for students */}
                              {!isStudent && <div className="flex-shrink-0 flex items-center gap-1 ml-1">
                                {/* Completed */}
                                <button
                                  onClick={async e => {
                                    e.stopPropagation();
                                    const next = l.status === 'completed' ? 'scheduled' : 'completed';
                                    mutate({ lessons: allLessons.map(x => x.id === l.id ? { ...x, status: next } : x) }, false);
                                    await fetch(`/api/lessons/${l.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
                                    mutate();
                                  }}
                                  title="Finalizat"
                                  className={`group/cb relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ease-out
                                    ${l.status === 'completed'
                                      ? 'bg-emerald-400 shadow-[0_0_10px_2px_#4ade80] scale-110 ring-2 ring-white/60'
                                      : 'bg-white/15 hover:bg-emerald-400/70 hover:scale-125 hover:shadow-[0_0_12px_3px_#4ade80] active:scale-95'}`}
                                >
                                  <span className="text-sm leading-none">✅</span>
                                  {l.status !== 'completed' && (
                                    <span className="absolute inset-0 rounded-full bg-emerald-400/20 scale-0 group-hover/cb:scale-150 opacity-0 group-hover/cb:opacity-0 transition-all duration-500 pointer-events-none" />
                                  )}
                                </button>
                                {/* Cancelled */}
                                <button
                                  onClick={async e => {
                                    e.stopPropagation();
                                    const next = l.status === 'cancelled' ? 'scheduled' : 'cancelled';
                                    if (next === 'cancelled') {
                                      setBurstId(l.id);
                                      setTimeout(() => setBurstId(null), 600);
                                    }
                                    mutate({ lessons: allLessons.map(x => x.id === l.id ? { ...x, status: next } : x) }, false);
                                    await fetch(`/api/lessons/${l.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
                                    mutate();
                                  }}
                                  title="Nu s-a făcut"
                                  className={`group/cx relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ease-out overflow-visible
                                    ${l.status === 'cancelled'
                                      ? 'bg-red-400 shadow-[0_0_10px_2px_#f87171] scale-110 ring-2 ring-white/60'
                                      : 'bg-white/15 hover:bg-red-400/70 hover:scale-125 hover:shadow-[0_0_12px_3px_#f87171] active:scale-95'}`}
                                >
                                  <span className={`text-sm leading-none select-none ${burstId === l.id ? 'animate-cancel-burst' : ''}`}>❌</span>
                                  {/* expanding ring on cancel */}
                                  {burstId === l.id && (
                                    <span className="absolute inset-0 rounded-full bg-red-400/60 animate-cancel-ring pointer-events-none" />
                                  )}
                                  {/* hover ripple */}
                                  {l.status !== 'cancelled' && (
                                    <span className="absolute inset-0 rounded-full bg-red-400/20 scale-0 group-hover/cx:scale-150 opacity-0 group-hover/cx:opacity-0 transition-all duration-500 pointer-events-none" />
                                  )}
                                </button>
                              </div>}
                            </div>

                            {/* Click action menu - hidden for students */}
                            {!isStudent && isMenu && (
                              <div
                                onClick={e => e.stopPropagation()}
                                className="absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-1 flex items-center gap-1 px-1.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl animate-fade-in"
                              >
                                <button
                                  onClick={() => { setEditLesson(l); setActiveMenu(null); }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors"
                                >
                                  <Pencil className="w-3 h-3" /> Editează
                                </button>
                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                                <button
                                  onClick={() => { setDeleteTarget(l); setActiveMenu(null); }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" /> Șterge
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Hover add button - hidden for students */}
                      {!isStudent && <button
                        onClick={() => openAddLesson(dateStr, hour)}
                        className={`absolute inset-x-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 hover:opacity-100 scale-90 group-hover:scale-100 hover:scale-100 transition-all duration-300 ease-out flex items-center justify-center gap-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 hover:shadow-2xl text-white text-xs font-bold shadow-lg pointer-events-none group-hover:pointer-events-auto hover:pointer-events-auto z-50 ring-2 ring-white/40
                          ${cells.length >= 1
                            ? 'group-hover:translate-y-full hover:translate-y-full'
                            : ''}`}
                      >
                        <Plus className="w-4 h-4" />
                        Adaugă
                      </button>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        )}

        {/* ── Legend ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pb-1">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-indigo-500" />Programat</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500" />Finalizat</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-slate-400" />Anulat</span>
          {!isStudent && <span className="ml-auto text-[11px] opacity-50 italic hidden sm:inline">Trage lecția în alt patrat · Click pentru editare</span>}
        </div>
      </main>

      <LessonForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => mutate()}
        defaultDate={addDate}
        defaultTime={addTime}
        showToast={toast}
      />

      <LessonForm
        open={!!editLesson}
        onClose={() => setEditLesson(null)}
        onSaved={() => mutate()}
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
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Se șterge…' : 'Șterge'}
          </Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}

const MONTH_DAY_HEADERS = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

function MonthCalendar({
  monthDates, allLessons, searchStudent, statusFilter, todayStr, reference,
  isStudent, activeMenu, setActiveMenu, openAddLesson, setEditLesson, setDeleteTarget, animDir,
}: {
  monthDates: Date[]; allLessons: Lesson[]; searchStudent: string; statusFilter: string;
  todayStr: string; reference: Date; isStudent: boolean;
  activeMenu: number | null; setActiveMenu: (id: number | null) => void;
  openAddLesson: (date: string, hour: number) => void;
  setEditLesson: (l: Lesson) => void; setDeleteTarget: (l: Lesson) => void;
  animDir: 'left' | 'right' | null;
}) {
  const currentMonth = reference.getMonth();
  const lessonsForDay = (dateStr: string) =>
    allLessons
      .filter(l => l.date === dateStr)
      .filter(l => !searchStudent || (l.student_name ?? '').toLowerCase().includes(searchStudent.toLowerCase()))
      .filter(l => !statusFilter || l.status === statusFilter);

  return (
    <div
      className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
      style={{
        opacity: animDir ? 0 : 1,
        transform: animDir === 'left' ? 'translateX(-12px)' : animDir === 'right' ? 'translateX(12px)' : 'translateX(0)',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
      }}
    >
      <div className="grid grid-cols-7 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
        {MONTH_DAY_HEADERS.map(d => (
          <div key={d} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{d}</div>
        ))}
      </div>
      {Array.from({ length: monthDates.length / 7 }, (_, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
          {monthDates.slice(weekIdx * 7, weekIdx * 7 + 7).map((d, di) => {
            const dateStr = fmtDate(d);
            const isToday = dateStr === todayStr;
            const inMonth = d.getMonth() === currentMonth;
            const dayLessons = lessonsForDay(dateStr);
            return (
              <div
                key={di}
                onClick={() => { if (!isStudent) { openAddLesson(dateStr, 9); setActiveMenu(null); } }}
                className={`relative min-h-[110px] p-2 border-r border-slate-100 dark:border-slate-800 last:border-r-0 flex flex-col gap-1 transition-colors
                  ${isToday ? 'bg-indigo-50/60 dark:bg-indigo-900/15' : ''}
                  ${!inMonth ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''}
                  ${!isStudent ? 'cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10' : ''}`}
              >
                <span className={`self-start text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-indigo-600 text-white shadow-md' : inMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>
                  {d.getDate()}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayLessons.slice(0, 3).map(l => {
                    const isMenu = activeMenu === l.id;
                    return (
                      <div key={l.id} className="relative">
                        <button
                          onClick={e => { if (isStudent) return; e.stopPropagation(); setActiveMenu(isMenu ? null : l.id); }}
                          className={`w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate flex items-center gap-1
                            ${l.status === 'scheduled' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : ''}
                            ${l.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : ''}
                            ${l.status === 'cancelled' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through' : ''}
                            ${!isStudent ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}
                            ${isMenu ? 'ring-1 ring-indigo-400' : ''}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${l.status === 'completed' ? 'bg-emerald-500' : l.status === 'cancelled' ? 'bg-slate-400' : 'bg-indigo-500'}`} />
                          <span className="truncate">{l.time?.slice(0, 5)} {l.student_name}</span>
                        </button>
                        {!isStudent && isMenu && (
                          <div
                            onClick={e => e.stopPropagation()}
                            className="absolute z-30 left-0 top-full mt-0.5 flex items-center gap-1 px-1.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl"
                          >
                            <button onClick={() => { setEditLesson(l); setActiveMenu(null); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40">
                              <Pencil className="w-3 h-3" /> Editează
                            </button>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                            <button onClick={() => { setDeleteTarget(l); setActiveMenu(null); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40">
                              <Trash2 className="w-3 h-3" /> Șterge
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {dayLessons.length > 3 && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1">+{dayLessons.length - 3} mai multe</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex flex-col items-center px-4 py-2 rounded-2xl ${color}`}>
      <span className="text-2xl font-extrabold leading-none">{value}</span>
      <span className="text-xs font-medium opacity-80 mt-0.5">{label}</span>
    </div>
  );
}

function MobileStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex-1 flex flex-col items-center py-2 rounded-xl ${color}`}>
      <span className="text-xl font-extrabold">{value}</span>
      <span className="text-[10px] font-medium opacity-80">{label}</span>
    </div>
  );
}
