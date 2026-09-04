'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { CalendarDays, Plus, Pencil, Trash2, GripVertical, Settings2, X, Check, Lock } from 'lucide-react';
import LessonForm from '@/components/lessons/LessonForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Lesson, Cabinet, CabinetDayStatus } from '@/lib/types';
import { DEFAULT_TIME_SLOTS } from '@/lib/timeSlots';

const CABINET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#14b8a6', '#3b82f6', '#f59e0b'];

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Standard cabinet-table time slots (45min lessons, 13:15-20:45). Any
// additional times already used by existing lessons on the selected day
// are appended so nothing gets hidden.
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

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export default function SchedulePage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);
  const isStudent = role === 'student';
  const isAdmin = role === 'admin';

  const reference = new Date();
  const [showForm, setShowForm]   = useState(false);
  const [addDate, setAddDate]     = useState('');
  const [addTime, setAddTime]     = useState('09:00');
  const [addCabinetId, setAddCabinetId] = useState<number | undefined>(undefined);
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayDayIdx());
  const [editLesson, setEditLesson]     = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [activeMenu, setActiveMenu]     = useState<number | null>(null);
  const [draggingId, setDraggingId]     = useState<number | null>(null);
  const [dropCell, setDropCell]         = useState<string | null>(null); // "date|hour"
  const [savingAssignment, setSavingAssignment] = useState<number | null>(null);
  const [showManageCabinets, setShowManageCabinets] = useState(false);
  const [managingCabinet, setManagingCabinet] = useState<Cabinet | null>(null);
  const [cabinetForm, setCabinetForm] = useState({ name: '', color: '#6366f1' });
  const [savingCabinet, setSavingCabinet] = useState(false);
  const [deletingCabinetId, setDeletingCabinetId] = useState<number | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);
  const [searchStudent, setSearchStudent] = useState('');
  const [statusFilterSched, setStatusFilterSched] = useState('');
  const { toasts, toast, remove } = useToast();

  const weekDates  = getWeekDates(reference);
  const rangeFrom  = fmtDate(weekDates[0]);
  const rangeTo    = fmtDate(weekDates[6]);

  const { data: allData, mutate } = useSWR('/api/lessons', fetcher);
  const allLessons: Lesson[] = allData?.lessons ?? [];
  const { data: cabinetsData, mutate: mutateCabinets } = useSWR('/api/cabinets', fetcher);
  const cabinets: Cabinet[] = cabinetsData?.cabinets ?? [];
  const assignments: { id: number; cabinet_id: number; day_of_week: number; teacher_id: number | null; teacher_name?: string | null }[] = cabinetsData?.assignments ?? [];
  const dayStatuses: CabinetDayStatus[] = cabinetsData?.dayStatuses ?? [];
  const { data: teachersData } = useSWR('/api/teachers', fetcher);
  const teachersList: { id: number; name: string }[] = teachersData?.teachers ?? [];
  const lessons = allLessons
    .filter((l: Lesson) => l.date >= rangeFrom && l.date <= rangeTo)
    .filter((l: Lesson) => !searchStudent || (l.student_name ?? '').toLowerCase().includes(searchStudent.toLowerCase()))
    .filter((l: Lesson) => !statusFilterSched || l.status === statusFilterSched);

  // Cabinet table: one day at a time, rows = time slots, columns = cabinets.
  const selectedDate = fmtDate(weekDates[selectedDayIdx]);
  const dayLessons = allLessons
    .filter(l => l.date === selectedDate)
    .filter(l => !searchStudent || (l.student_name ?? '').toLowerCase().includes(searchStudent.toLowerCase()))
    .filter(l => !statusFilterSched || l.status === statusFilterSched);

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
  const cabinetColumns: { id: number | 'none'; name: string; color?: string }[] = [
    ...cabinets,
    ...(hasUnassigned ? [{ id: 'none' as const, name: 'Fără cabinet' }] : []),
  ];
  const selectedDow = weekDates[selectedDayIdx].getDay(); // 0=Sun..6=Sat, matches DB day_of_week
  const assignmentFor = (cabinetId: number) => assignments.find(a => a.cabinet_id === cabinetId && a.day_of_week === selectedDow);
  const dayStatusFor = (cabinetId: number): 'liber' | 'ocupat' =>
    dayStatuses.find(s => s.cabinet_id === cabinetId && s.day_of_week === selectedDow)?.status ?? 'liber';

  const toggleDayStatus = async (cabinetId: number, current: 'liber' | 'ocupat') => {
    const next = current === 'liber' ? 'ocupat' : 'liber';
    setTogglingStatusId(cabinetId);
    try {
      const res = await fetch(`/api/cabinets/${cabinetId}/day-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: selectedDow, status: next }),
      });
      if (res.ok) mutateCabinets(); else toast('Eroare la salvare', 'error');
    } finally {
      setTogglingStatusId(null);
    }
  };

  // ── Cabinet CRUD (Gestionare) ──────────────────────────────
  const openEditCabinet = (cab: Cabinet) => {
    setManagingCabinet(cab);
    setCabinetForm({ name: cab.name, color: cab.color });
  };

  const saveCabinetForm = async () => {
    if (!cabinetForm.name.trim()) return;
    setSavingCabinet(true);
    try {
      if (managingCabinet) {
        const res = await fetch(`/api/cabinets/${managingCabinet.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cabinetForm),
        });
        if (res.ok) { toast('Cabinet actualizat', 'success'); mutateCabinets(); setManagingCabinet(null); setCabinetForm({ name: '', color: '#6366f1' }); }
        else { const d = await res.json().catch(() => ({})); toast(d.error ?? `Eroare ${res.status}`, 'error'); }
      } else {
        const res = await fetch('/api/cabinets', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cabinetForm),
        });
        if (res.ok) { toast('Cabinet adăugat', 'success'); mutateCabinets(); setCabinetForm({ name: '', color: '#6366f1' }); }
        else { const d = await res.json().catch(() => ({})); toast(d.error ?? `Eroare ${res.status}`, 'error'); }
      }
    } finally {
      setSavingCabinet(false);
    }
  };

  const deleteCabinetRow = async (id: number) => {
    setDeletingCabinetId(id);
    const res = await fetch(`/api/cabinets/${id}`, { method: 'DELETE' });
    setDeletingCabinetId(null);
    if (res.ok) { toast('Cabinet șters', 'success'); mutateCabinets(); }
    else toast('Eroare la ștergere', 'error');
  };

  const handleTeacherChange = async (cabinetId: number, teacherId: string) => {
    setSavingAssignment(cabinetId);
    try {
      const res = await fetch(`/api/cabinets/${cabinetId}/assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: selectedDow, teacher_id: teacherId || null }),
      });
      if (!res.ok) { toast('Eroare la schimbarea profesorului', 'error'); return; }
      toast('Profesor actualizat', 'success');
      mutateCabinets();
    } finally {
      setSavingAssignment(null);
    }
  };

  const openAddLesson = (date: string, hourOrTime: number | string, cabinetId?: number) => {
    setAddDate(date);
    setAddTime(typeof hourOrTime === 'number' ? `${pad2(hourOrTime)}:00` : hourOrTime);
    setAddCabinetId(cabinetId);
    setShowForm(true);
  };

  // ── Drag & drop — cabinet table (day view) ───────────────────
  const handleCabinetDrop = async (cabinetId: number | 'none', time: string) => {
    const id = draggingId;
    setDraggingId(null);
    setDropCell(null);
    if (!id) return;
    const lesson = allLessons.find(l => l.id === id);
    if (!lesson) return;
    const newCabinetId = cabinetId === 'none' ? null : cabinetId;
    if ((lesson.cabinet_id ?? null) === newCabinetId && lesson.time?.slice(0, 5) === time) return;

    const conflict = allLessons.find(l =>
      l.id !== id && l.date === lesson.date && (l.cabinet_id ?? null) === newCabinetId &&
      l.time?.slice(0, 5) === time && l.status !== 'cancelled',
    );
    if (conflict) {
      toast(`Conflict: cabinetul e deja ocupat la ${time} de ${conflict.student_name}`, 'error');
      return;
    }

    // Optimistic update
    mutate(
      { lessons: allLessons.map(l => l.id === id ? { ...l, cabinet_id: newCabinetId, time } : l) },
      false,
    );

    const res = await fetch(`/api/lessons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cabinet_id: newCabinetId, time }),
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
  const totalWeek   = lessons.length;
  const scheduled = lessons.filter(l => l.status === 'scheduled').length;
  const completed = lessons.filter(l => l.status === 'completed').length;
  const cancelled = lessons.filter(l => l.status === 'cancelled').length;

  return (
    <div className="flex flex-col flex-1" onClick={() => activeMenu !== null && setActiveMenu(null)}>

      {/* ── Animated Banner ───────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-600 to-accent-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Program Privat — pe zile</h1>
            <p className="text-brand-200 text-sm font-medium mt-0.5">{isStudent ? 'Vizualizează lecțiile tale din această săptămână' : 'Gestionează lecțiile din această săptămână'}</p>
          </div>
          <div className="ml-auto hidden sm:flex gap-3">
            <StatBadge label="Total"      value={totalWeek} color="bg-white/20 text-white" />
            <StatBadge label="Programate" value={scheduled} color="bg-brand-300/30 text-white" />
            <StatBadge label="Finalizate" value={completed} color="bg-emerald-300/30 text-white" />
            {cancelled > 0 && <StatBadge label="Anulate" value={cancelled} color="bg-red-300/30 text-white" />}
          </div>
        </div>
      </div>

      {/* ── Mobile stats ─────────────────────────────────── */}
      <div className="flex sm:hidden gap-3 px-4 pt-4">
        <MobileStat label="Total"  value={totalWeek} color="bg-slate-800 text-white" />
        <MobileStat label="Prog."  value={scheduled} color="bg-brand-600 text-white" />
        <MobileStat label="Fin."   value={completed}  color="bg-emerald-600 text-white" />
      </div>

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">

        {/* ── Calendar grid ────────────────────────────────── */}
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
            {isAdmin && (
              <button
                onClick={() => setShowManageCabinets(true)}
                className="ml-auto flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <Settings2 className="w-4 h-4" /> Gestionare cabinete
              </button>
            )}
          </div>

          {/* Cabinet table — Ora | Cabinet 1 | Cabinet 2 | Cabinet 3 */}
          <div className="flex-1 overflow-auto p-4">
            {cabinetColumns.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-sm font-semibold text-slate-500">Nu există cabinete configurate</p>
                {isAdmin && (
                  <button onClick={() => setShowManageCabinets(true)} className="text-sm text-brand-600 hover:underline">Configurează cabinetele</button>
                )}
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
                              <button
                                type="button"
                                disabled={!isAdmin || togglingStatusId === col.id}
                                onClick={() => isAdmin && typeof col.id === 'number' && toggleDayStatus(col.id, status)}
                                title={isAdmin ? 'Schimbă statusul' : undefined}
                                className={`self-start text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full normal-case bg-red-100 text-red-700 ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                              >
                                Ocupat
                              </button>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                  {!isStudent && (
                    <tr className="bg-brand-50/60">
                      <th className="border border-brand-100 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-brand-400 text-left">Profesor</th>
                      {cabinetColumns.map(col => (
                        <th key={col.id} className="border border-brand-100 px-2 py-2.5 font-normal">
                          {typeof col.id === 'number' ? (
                            <select
                              value={assignmentFor(col.id)?.teacher_id ?? ''}
                              onChange={e => handleTeacherChange(col.id as number, e.target.value)}
                              disabled={savingAssignment === col.id}
                              className="w-full text-sm font-semibold text-gray-700 border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
                            >
                              <option value="">— fără profesor —</option>
                              {teachersList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          ) : <span className="block text-center text-xs text-gray-300">—</span>}
                        </th>
                      ))}
                    </tr>
                  )}
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
                        const cellKey = `${selectedDate}|${col.id}|${time}`;
                        const isDropTarget = dropCell === cellKey && draggingId !== null;
                        return (
                          <td
                            key={col.id}
                            onDragOver={e => {
                              if (isStudent || draggingId === null) return;
                              e.preventDefault();
                              if (dropCell !== cellKey) setDropCell(cellKey);
                            }}
                            onDragLeave={() => { if (dropCell === cellKey) setDropCell(null); }}
                            onDrop={e => { if (isStudent) return; e.preventDefault(); handleCabinetDrop(col.id, time); }}
                            className={`group relative border border-gray-200 px-2.5 py-2.5 align-top transition-colors duration-150 min-w-[180px] min-h-[64px]
                              ${isDropTarget ? 'bg-brand-50 ring-2 ring-brand-400 ring-inset' : 'hover:bg-gray-50'}`}
                          >
                            {cellLessons.map(l => {
                              const isDragging = draggingId === l.id;
                              const isMenu     = activeMenu === l.id;
                              const statusStyle =
                                l.status === 'completed' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                                l.status === 'cancelled' ? 'bg-gray-100 border-gray-300 text-gray-400 line-through' :
                                'bg-brand-50 border-brand-300 text-brand-800';
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
                                  className={`relative text-sm px-3 py-2.5 rounded-lg border mb-1 last:mb-0 select-none ${isStudent ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
                                    transition-all duration-150 ${statusStyle}
                                    ${isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md'}
                                    ${isMenu ? 'ring-2 ring-brand-400 shadow-lg' : ''}`}
                                >
                                  <div className="flex items-start gap-1.5">
                                    <GripVertical className="w-3.5 h-3.5 mt-0.5 opacity-40 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold truncate">{l.student_name}</p>
                                      <p className="truncate text-xs mt-0.5">
                                        <span className="font-semibold" style={{ color: 'inherit' }}>{l.discipline || '—'}</span>
                                        <span className="opacity-70"> · {l.teacher_name}</span>
                                      </p>
                                    </div>
                                  </div>

                                  {!isStudent && isMenu && (
                                    <div
                                      onClick={e => e.stopPropagation()}
                                      className="absolute z-30 left-0 top-full mt-1 flex items-center gap-1 px-1.5 py-1 rounded-xl bg-white border border-gray-200 shadow-2xl animate-fade-in"
                                    >
                                      <button
                                        onClick={() => { setEditLesson(l); setActiveMenu(null); }}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                                      ><Pencil className="w-3 h-3" /> Editează</button>
                                      <button
                                        onClick={() => { setDeleteTarget(l); setActiveMenu(null); }}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                      ><Trash2 className="w-3 h-3" /> Șterge</button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {!isStudent && cellLessons.length === 0 && (
                              <button
                                onClick={() => openAddLesson(selectedDate, time, typeof col.id === 'number' ? col.id : undefined)}
                                className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-brand-300 text-brand-500 text-[11px] font-semibold hover:bg-brand-50"
                              >
                                <Plus className="w-3.5 h-3.5" /> Adaugă
                              </button>
                            )}
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
          {!isStudent && <span className="ml-auto text-[11px] opacity-50 italic hidden sm:inline">Trage lecția în alt cabinet/oră · Click pentru editare</span>}
        </div>
      </main>

      <LessonForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => mutate()}
        defaultDate={addDate}
        defaultTime={addTime}
        defaultCabinetId={addCabinetId}
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

      <Modal open={showManageCabinets} onClose={() => { setShowManageCabinets(false); setManagingCabinet(null); setCabinetForm({ name: '', color: '#6366f1' }); }} title="Gestionare Cabinete" size="lg">
        <div className="space-y-6">
          {/* Add / Edit form */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
              {managingCabinet ? `Editează: ${managingCabinet.name}` : 'Adaugă cabinet nou'}
            </h3>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-40">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Nume cabinet</label>
                <input
                  value={cabinetForm.name}
                  onChange={e => setCabinetForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="ex. Cabinet 1"
                  className="w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Culoare</label>
                <div className="flex gap-1.5 flex-wrap" style={{ maxWidth: '160px' }}>
                  {CABINET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCabinetForm(p => ({ ...p, color: c }))}
                      className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                      style={{ backgroundColor: c, borderColor: cabinetForm.color === c ? '#fff' : 'transparent', boxShadow: cabinetForm.color === c ? `0 0 0 2px ${c}` : 'none' }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {managingCabinet && (
                  <button
                    onClick={() => { setManagingCabinet(null); setCabinetForm({ name: '', color: '#6366f1' }); }}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-500 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <Button onClick={saveCabinetForm} disabled={savingCabinet || !cabinetForm.name.trim()}>
                  {savingCabinet ? '…' : managingCabinet ? <Check className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Adaugă</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Cabinet list */}
          {cabinets.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nu există cabinete. Adaugă unul mai sus.</p>
          ) : (
            <div className="space-y-2">
              {cabinets.map(cab => {
                const status = dayStatusFor(cab.id);
                return (
                  <div key={cab.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cab.color }} />
                    <p className="font-bold text-slate-800 dark:text-slate-100 flex-1">{cab.name}</p>
                    <button
                      onClick={() => toggleDayStatus(cab.id, status)}
                      disabled={togglingStatusId === cab.id}
                      title={`Statusul pentru ${DAY_LABELS[selectedDayIdx]}`}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors disabled:opacity-50
                        ${status === 'ocupat' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                    >
                      {status === 'ocupat' ? 'Ocupat' : 'Liber'}
                    </button>
                    <button onClick={() => openEditCabinet(cab)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteCabinetRow(cab.id)} disabled={deletingCabinetId === cab.id} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Statusul Ocupat/Liber de mai sus este pentru ziua selectată în program ({DAY_LABELS[selectedDayIdx]}).
          </p>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={remove} />
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
