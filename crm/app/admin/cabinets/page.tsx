'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import {
  ChevronLeft, ChevronRight, DoorOpen, Plus, Pencil, Trash2,
  Settings2, X, Check, UserRound,
} from 'lucide-react';
import LessonForm from '@/components/lessons/LessonForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Lesson, Cabinet, CabinetTeacherAssignment } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// 45-minute slots 08:00 → 17:45
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  let min = 8 * 60;
  while (min < 18 * 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    min += 45;
  }
  return slots;
})();

const DAYS_RO = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
const SHORT_DAYS = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];

function fmtDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function getWeekDates(ref: Date): Date[] {
  const day = ref.getDay();
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - day + 1);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// Find closest 45-min slot to a lesson's time
function snapToSlot(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + m;
  let best = TIME_SLOTS[0];
  let bestDiff = Infinity;
  for (const slot of TIME_SLOTS) {
    const [sh, sm] = slot.split(':').map(Number);
    const diff = Math.abs(totalMin - (sh * 60 + sm));
    if (diff < bestDiff) { bestDiff = diff; best = slot; }
  }
  return best;
}

const CABINET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
  '#22c55e', '#14b8a6', '#3b82f6', '#f59e0b',
];

export default function CabinetsPage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);
  const isAdmin = role === 'admin';

  const today = fmtDate(new Date());
  const [reference, setReference] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [animDir, setAnimDir] = useState<'left' | 'right' | null>(null);

  // Cabinet management modal state
  const [showManage, setShowManage] = useState(false);
  const [managingCabinet, setManagingCabinet] = useState<Cabinet | null>(null);
  const [cabinetForm, setCabinetForm] = useState({ name: '', color: '#6366f1' });
  const [savingCabinet, setSavingCabinet] = useState(false);
  const [deletingCabinetId, setDeletingCabinetId] = useState<number | null>(null);

  // Lesson form state
  const [addCell, setAddCell] = useState<{ cabinetId: number; time: string; teacherId: number | null } | null>(null);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toasts, toast, remove } = useToast();

  // Data fetching
  const { data: cabData, mutate: mutateCabs } = useSWR('/api/cabinets', fetcher);
  const { data: lessonsData, mutate: mutateLessons } = useSWR(
    `/api/lessons?date=${selectedDate}`,
    fetcher,
  );
  const { data: teachersData } = useSWR('/api/teachers', fetcher);

  const cabinets: Cabinet[]                     = cabData?.cabinets ?? [];
  const allAssignments: CabinetTeacherAssignment[] = (cabData?.assignments ?? []).map((a: CabinetTeacherAssignment & { teachers?: { name: string } | null }) => ({
    ...a,
    teacher_name: (a as unknown as { teachers?: { name: string } | null }).teachers?.name ?? a.teacher_name ?? null,
  }));
  const lessons: Lesson[] = lessonsData?.lessons ?? [];
  const teachers: { id: number; name: string }[] = teachersData?.teachers ?? [];

  const weekDates = getWeekDates(reference);
  const selectedDow = new Date(selectedDate + 'T00:00:00').getDay();

  // Get teacher assignment for a cabinet on a given day-of-week
  const getAssignment = useCallback(
    (cabinetId: number, dow: number) =>
      allAssignments.find(a => a.cabinet_id === cabinetId && a.day_of_week === dow) ?? null,
    [allAssignments],
  );

  // Get lesson for a specific cabinet + time slot
  const getCellLesson = (cabinetId: number, slot: string): Lesson | null => {
    return lessons.find(l => l.cabinet_id === cabinetId && snapToSlot(l.time ?? '') === slot) ?? null;
  };

  // Lessons without cabinet assignment (to show in info strip)
  const unassignedCount = lessons.filter(l => !l.cabinet_id).length;

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navigate = (dir: 'prev' | 'next') => {
    setAnimDir(dir === 'prev' ? 'right' : 'left');
    setTimeout(() => {
      const d = new Date(reference);
      d.setDate(d.getDate() + (dir === 'prev' ? -7 : 7));
      setReference(d);
      // Keep same day-of-week, update date
      const newWeek = getWeekDates(d);
      const sameDoW = newWeek.find(wd => wd.getDay() === selectedDow);
      if (sameDoW) setSelectedDate(fmtDate(sameDoW));
      setAnimDir(null);
    }, 180);
  };

  const goToday = () => {
    setAnimDir('right');
    setTimeout(() => {
      setReference(new Date());
      setSelectedDate(today);
      setAnimDir(null);
    }, 180);
  };

  // ── Cabinet CRUD ─────────────────────────────────────────────────────────────
  const openAddCabinet = () => {
    setManagingCabinet(null);
    setCabinetForm({ name: '', color: '#6366f1' });
  };

  const openEditCabinet = (cab: Cabinet) => {
    setManagingCabinet(cab);
    setCabinetForm({ name: cab.name, color: cab.color });
  };

  const saveCabinet = async () => {
    if (!cabinetForm.name.trim()) return;
    setSavingCabinet(true);
    try {
      if (managingCabinet) {
        const res = await fetch(`/api/cabinets/${managingCabinet.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cabinetForm),
        });
        if (res.ok) { toast('Cabinet actualizat', 'success'); mutateCabs(); setManagingCabinet(null); setCabinetForm({ name: '', color: '#6366f1' }); }
        else { const d = await res.json().catch(() => ({})); toast(d.error ?? `Eroare ${res.status}`, 'error'); }
      } else {
        const res = await fetch('/api/cabinets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cabinetForm),
        });
        if (res.ok) { toast('Cabinet adăugat', 'success'); mutateCabs(); setCabinetForm({ name: '', color: '#6366f1' }); }
        else { const d = await res.json().catch(() => ({})); toast(d.error ?? `Eroare ${res.status}`, 'error'); }
      }
    } finally {
      setSavingCabinet(false);
    }
  };

  const deleteCabinet = async (id: number) => {
    setDeletingCabinetId(id);
    const res = await fetch(`/api/cabinets/${id}`, { method: 'DELETE' });
    setDeletingCabinetId(null);
    if (res.ok) { toast('Cabinet șters', 'success'); mutateCabs(); }
    else toast('Eroare la ștergere', 'error');
  };

  // ── Teacher assignment ───────────────────────────────────────────────────────
  const setTeacherAssignment = async (cabinetId: number, dow: number, teacherId: number | null) => {
    await fetch(`/api/cabinets/${cabinetId}/assignments`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: dow, teacher_id: teacherId }),
    });
    mutateCabs();
  };

  // ── Lesson actions ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/lessons/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast('Lecție ștearsă', 'success'); mutateLessons(); }
      else toast('Eroare la ștergere', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const fmtWeekRange = () => {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const a = weekDates[0].toLocaleDateString('ro-RO', opts);
    const b = weekDates[5].toLocaleDateString('ro-RO', opts);
    return `${a} – ${b} ${weekDates[0].getFullYear()}`;
  };

  return (
    <div className="flex flex-col flex-1">

      {/* ── Header banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <DoorOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Orar pe Cabinete</h1>
            <p className="text-purple-200 text-sm font-medium mt-0.5">
              Vizualizează și gestionează programul pe încăperi
            </p>
          </div>
          <div className="ml-auto flex gap-3">
            <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-white/20 text-white">
              <span className="text-2xl font-extrabold leading-none">{cabinets.length}</span>
              <span className="text-xs font-medium opacity-80 mt-0.5">Cabinete</span>
            </div>
            <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-white/20 text-white">
              <span className="text-2xl font-extrabold leading-none">{lessons.filter(l => l.cabinet_id).length}</span>
              <span className="text-xs font-medium opacity-80 mt-0.5">Lecții azi</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">

        {/* ── Week navigation ─────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('prev')}
            className="group flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200" />
          </button>

          <div
            className="flex flex-col items-center min-w-64 select-none transition-all duration-200"
            style={{
              opacity: animDir ? 0 : 1,
              transform: animDir === 'left' ? 'translateX(-20px) scale(0.97)' : animDir === 'right' ? 'translateX(20px) scale(0.97)' : 'translateX(0) scale(1)',
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-0.5">Săptămâna</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{fmtWeekRange()}</span>
          </div>

          <button
            onClick={() => navigate('next')}
            className="group flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200" />
          </button>

          <button
            onClick={goToday}
            className="ml-1 px-5 py-2 text-sm font-bold rounded-2xl bg-violet-600 text-white shadow-md hover:bg-violet-500 hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Azi
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowManage(true)}
              className="ml-2 flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-md hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 hover:scale-105"
            >
              <Settings2 className="w-4 h-4" />
              Gestionare
            </button>
          )}
        </div>

        {/* ── Day tabs ────────────────────────────────────────────────── */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{
            opacity: animDir ? 0 : 1,
            transition: 'opacity 0.18s ease',
          }}
        >
          {weekDates.map((d, i) => {
            const ds = fmtDate(d);
            const isSelected = ds === selectedDate;
            const isToday = ds === today;
            const dow = d.getDay();
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(ds)}
                className={`flex-shrink-0 flex flex-col items-center px-5 py-3 rounded-2xl border-2 transition-all duration-200 hover:scale-105 active:scale-95
                  ${isSelected
                    ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/40'
                    : isToday
                      ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700'}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{SHORT_DAYS[dow]}</span>
                <span className="text-lg font-extrabold leading-tight mt-0.5">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* ── Unassigned lessons notice ───────────────────────────────── */}
        {unassignedCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm font-medium">
            <span className="text-lg">⚠️</span>
            <span>{unassignedCount} {unassignedCount === 1 ? 'lecție' : 'lecții'} din această zi nu {unassignedCount === 1 ? 'are' : 'au'} cabinet alocat — {unassignedCount === 1 ? 'apare' : 'apar'} doar în „Program".</span>
          </div>
        )}

        {/* ── No cabinets state ───────────────────────────────────────── */}
        {cabinets.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <DoorOpen className="w-10 h-10 text-violet-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">Nu există cabinete</p>
              <p className="text-sm text-slate-400 mt-1">
                {isAdmin ? 'Apasă „Gestionare" pentru a adăuga cabinete și a asigna profesori.' : 'Administratorul nu a configurat încă niciun cabinet.'}
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowManage(true)}>
                <Settings2 className="w-4 h-4 mr-2" /> Configurează cabinete
              </Button>
            )}
          </div>
        )}

        {/* ── Cabinet grid ─────────────────────────────────────────────── */}
        {cabinets.length > 0 && (
          <div
            className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            style={{
              opacity: animDir ? 0 : 1,
              transform: animDir === 'left' ? 'translateX(-12px)' : animDir === 'right' ? 'translateX(12px)' : 'translateX(0)',
              transition: 'opacity 0.18s ease, transform 0.18s ease',
            }}
          >
            <div style={{ minWidth: `${Math.max(600, cabinets.length * 220 + 80)}px` }}>

              {/* Column headers */}
              <div
                className="grid border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10"
                style={{ gridTemplateColumns: `80px repeat(${cabinets.length}, 1fr)` }}
              >
                <div className="py-4 px-3 text-xs font-mono text-slate-400 text-right select-none">Ora</div>
                {cabinets.map(cab => {
                  const asgn = getAssignment(cab.id, selectedDow);
                  return (
                    <div
                      key={cab.id}
                      className="py-4 px-4 text-center border-l border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cab.color }}
                        />
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{cab.name}</p>
                      </div>
                      {asgn?.teacher_name ? (
                        <p className="text-xs font-semibold" style={{ color: cab.color }}>
                          {asgn.teacher_name}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Fără profesor</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Time-slot rows */}
              {TIME_SLOTS.map(slot => (
                <div
                  key={slot}
                  className="grid border-b border-slate-100 dark:border-slate-800"
                  style={{ gridTemplateColumns: `80px repeat(${cabinets.length}, 1fr)`, minHeight: '72px' }}
                >
                  <div className="py-3 px-3 text-xs font-mono text-slate-400 text-right pt-3 border-r border-slate-100 dark:border-slate-800 select-none">
                    {slot}
                  </div>

                  {cabinets.map(cab => {
                    const lesson = getCellLesson(cab.id, slot);
                    const asgn   = getAssignment(cab.id, selectedDow);
                    return (
                      <div
                        key={cab.id}
                        className="group relative border-l border-slate-100 dark:border-slate-800 p-2 flex flex-col gap-1 transition-colors duration-150 hover:bg-violet-50/40 dark:hover:bg-violet-900/10"
                      >
                        {lesson ? (
                          <LessonCell
                            lesson={lesson}
                            color={cab.color}
                            onEdit={() => setEditLesson(lesson)}
                            onDelete={() => setDeleteTarget(lesson)}
                            isAdmin={isAdmin}
                          />
                        ) : (
                          isAdmin && (
                            <button
                              onClick={() => setAddCell({
                                cabinetId: cab.id,
                                time: slot,
                                teacherId: asgn?.teacher_id ?? null,
                              })}
                              className="absolute inset-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700 text-violet-400 dark:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:border-violet-400 hover:text-violet-600 text-xs font-semibold"
                            >
                              <Plus className="w-3.5 h-3.5" /> Adaugă
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Legend ─────────────────────────────────────────────────── */}
        {cabinets.length > 0 && (
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pb-1">
            {cabinets.map(c => (
              <span key={c.id} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </span>
            ))}
            {isAdmin && (
              <span className="ml-auto text-[11px] opacity-50 italic hidden sm:inline">
                Click pe celulă goală pentru a adăuga o lecție
              </span>
            )}
          </div>
        )}
      </main>

      {/* ── Manage Cabinets Modal ───────────────────────────────────────── */}
      <Modal open={showManage} onClose={() => { setShowManage(false); setManagingCabinet(null); setCabinetForm({ name: '', color: '#6366f1' }); }} title="Gestionare Cabinete" size="lg">
        <div className="space-y-6">

          {/* Add / Edit form */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
              {managingCabinet ? `Editează: ${managingCabinet.name}` : 'Adaugă cabinet nou'}
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Nume cabinet</label>
                <input
                  value={cabinetForm.name}
                  onChange={e => setCabinetForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="ex. Cabinet 1"
                  className="w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
                      style={{
                        backgroundColor: c,
                        borderColor: cabinetForm.color === c ? '#fff' : 'transparent',
                        boxShadow: cabinetForm.color === c ? `0 0 0 2px ${c}` : 'none',
                      }}
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
                <Button onClick={saveCabinet} disabled={savingCabinet || !cabinetForm.name.trim()}>
                  {savingCabinet ? '…' : managingCabinet ? <Check className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Adaugă</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Cabinet list */}
          {cabinets.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nu există cabinete. Adaugă unul mai sus.</p>
          ) : (
            <div className="space-y-3">
              {cabinets.map(cab => (
                <div key={cab.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                  {/* Cabinet header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cab.color }} />
                    <p className="font-bold text-slate-800 dark:text-slate-100 flex-1">{cab.name}</p>
                    <button
                      onClick={() => openEditCabinet(cab)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCabinet(cab.id)}
                      disabled={deletingCabinetId === cab.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Teacher assignment per day */}
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <UserRound className="w-3 h-3" /> Profesor pe zi
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {[1, 2, 3, 4, 5, 6].map(dow => {
                        const asgn = getAssignment(cab.id, dow);
                        return (
                          <div key={dow} className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-center text-slate-500 dark:text-slate-400">
                              {DAYS_RO[dow].slice(0, 3)}
                            </span>
                            <select
                              value={asgn?.teacher_id ?? ''}
                              onChange={e => setTeacherAssignment(cab.id, dow, e.target.value ? Number(e.target.value) : null)}
                              className="w-full px-1.5 py-1 text-[11px] rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400"
                            >
                              <option value="">—</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name.split(' ')[0]}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Add lesson form ─────────────────────────────────────────────── */}
      <LessonForm
        open={!!addCell}
        onClose={() => setAddCell(null)}
        onSaved={() => mutateLessons()}
        defaultDate={selectedDate}
        defaultTime={addCell?.time}
        defaultCabinetId={addCell?.cabinetId}
        defaultTeacherId={addCell?.teacherId}
        showToast={toast}
      />

      {/* ── Edit lesson form ────────────────────────────────────────────── */}
      <LessonForm
        open={!!editLesson}
        onClose={() => setEditLesson(null)}
        onSaved={() => mutateLessons()}
        lesson={editLesson}
        showToast={toast}
      />

      {/* ── Delete confirmation ─────────────────────────────────────────── */}
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

// ── Sub-components ────────────────────────────────────────────────────────────

function LessonCell({
  lesson, color, onEdit, onDelete, isAdmin,
}: {
  lesson: Lesson;
  color: string;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusBg: Record<string, string> = {
    scheduled: 'bg-indigo-500/90 border-indigo-400',
    completed:  'bg-emerald-500/90 border-emerald-400',
    cancelled:  'bg-slate-400/60 border-slate-300',
  };

  return (
    <div
      onClick={() => isAdmin && setMenuOpen(v => !v)}
      className={`relative text-xs px-2.5 py-2 rounded-xl border text-white select-none
        transition-all duration-200
        ${statusBg[lesson.status] ?? statusBg.scheduled}
        ${isAdmin ? 'cursor-pointer hover:scale-[1.03] hover:shadow-lg hover:-translate-y-0.5' : 'cursor-default'}
        ${lesson.status === 'cancelled' ? 'line-through opacity-60' : ''}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: color }}
    >
      <p className="font-bold truncate">{lesson.student_name}</p>
      <p className="opacity-80 truncate text-[10px] mt-0.5">
        {lesson.time?.slice(0, 5)} · {lesson.duration}min
        {lesson.teacher_name && ` · ${lesson.teacher_name.split(' ')[0]}`}
      </p>

      {isAdmin && menuOpen && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-1 flex items-center gap-1 px-1.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl"
        >
          <button
            onClick={() => { onEdit(); setMenuOpen(false); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Editează
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={() => { onDelete(); setMenuOpen(false); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Șterge
          </button>
        </div>
      )}
    </div>
  );
}
