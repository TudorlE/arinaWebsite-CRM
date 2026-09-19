'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { CalendarDays, Plus, Pencil, Trash2, GripVertical, Settings2, X, Check, Lock } from 'lucide-react';
import RecurringScheduleForm from '@/components/recurring-schedule/RecurringScheduleForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { RecurringSchedule, Cabinet, CabinetDayStatus } from '@/lib/types';
import AccessDenied from '@/components/AccessDenied';
import PageBanner from '@/components/ui/PageBanner';
import { DEFAULT_TIME_SLOTS } from '@/lib/timeSlots';

const CABINET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#14b8a6', '#3b82f6', '#f59e0b'];

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Standard cabinet-table time slots (45min lessons, 13:15-20:45). Any
// additional times already used by existing schedules on the selected day
// are appended so nothing gets hidden.
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

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = ((h * 60 + m + minutes) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function diffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

export default function SchedulePage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);
  const isStudent = role === 'student';
  const isAdmin = role === 'admin';

  const [selectedDayIdx, setSelectedDayIdx] = useState(todayDayIdx());
  const [showForm, setShowForm]         = useState(false);
  const [addDow, setAddDow]             = useState(0);
  const [addTime, setAddTime]           = useState('09:00');
  const [addCabinetId, setAddCabinetId] = useState<number | undefined>(undefined);
  const [editSchedule, setEditSchedule] = useState<RecurringSchedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringSchedule | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [activeMenu, setActiveMenu]     = useState<number | null>(null);
  const [draggingId, setDraggingId]     = useState<number | null>(null);
  const [dropCell, setDropCell]         = useState<string | null>(null); // "cabinetId|time"
  const [showManageCabinets, setShowManageCabinets] = useState(false);
  const [managingCabinet, setManagingCabinet] = useState<Cabinet | null>(null);
  const [cabinetForm, setCabinetForm] = useState({ name: '', color: '#6366f1' });
  const [savingCabinet, setSavingCabinet] = useState(false);
  const [deletingCabinetId, setDeletingCabinetId] = useState<number | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);
  const [searchStudent, setSearchStudent] = useState('');
  const { toasts, toast, remove } = useToast();

  const selectedDow = dowForIdx(selectedDayIdx);

  const { data: allData, mutate } = useSWR('/api/recurring-schedules?active=true', fetcher);
  const allSchedules: RecurringSchedule[] = allData?.schedules ?? [];
  const { data: cabinetsData, mutate: mutateCabinets } = useSWR('/api/cabinets', fetcher);
  const cabinets: Cabinet[] = cabinetsData?.cabinets ?? [];
  const dayStatuses: CabinetDayStatus[] = cabinetsData?.dayStatuses ?? [];

  const daySchedules = allSchedules
    .filter(s => s.day_of_week === selectedDow)
    .filter(s => !searchStudent || (s.student_name ?? '').toLowerCase().includes(searchStudent.toLowerCase()));

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
  // Only the cabinets actually configured (via Gestionare cabinete) get a
  // column — no synthetic "Fără cabinet" bucket, even if some schedule lacks
  // a cabinet assignment.
  const cabinetColumns: { id: number | 'none'; name: string; color?: string }[] = cabinets;
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

  const openAddSlot = (dow: number, time: string, cabinetId?: number) => {
    setEditSchedule(null);
    setAddDow(dow);
    setAddTime(time);
    setAddCabinetId(cabinetId);
    setShowForm(true);
  };

  // ── Drag & drop — cabinet table (day view) ───────────────────
  const handleCabinetDrop = async (cabinetId: number | 'none', time: string) => {
    const id = draggingId;
    setDraggingId(null);
    setDropCell(null);
    if (!id) return;
    const schedule = allSchedules.find(s => s.id === id);
    if (!schedule) return;
    const newCabinetId = cabinetId === 'none' ? null : cabinetId;
    if ((schedule.cabinet_id ?? null) === newCabinetId && schedule.start_time?.slice(0, 5) === time) return;

    const conflict = daySchedules.find(s =>
      s.id !== id && (s.cabinet_id ?? null) === newCabinetId && s.start_time?.slice(0, 5) === time,
    );
    if (conflict) {
      toast(`Conflict: cabinetul e deja ocupat la ${time} de ${conflict.student_name}`, 'error');
      return;
    }

    const duration = diffMinutes(schedule.start_time.slice(0, 5), schedule.end_time.slice(0, 5));
    const newEnd = addMinutes(time, duration);

    // Optimistic update
    mutate(
      { schedules: allSchedules.map(s => s.id === id ? { ...s, cabinet_id: newCabinetId, start_time: time, end_time: newEnd } : s) },
      false,
    );

    const res = await fetch(`/api/recurring-schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cabinet_id: newCabinetId, start_time: time, end_time: newEnd }),
    });
    if (!res.ok) {
      toast('Eroare la mutare', 'error');
      mutate();
    } else {
      toast('Orar mutat', 'success');
      mutate();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/recurring-schedules/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast('Orar eliminat din program', 'success'); mutate(); }
      else toast('Eroare la ștergere', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const totalActive = allSchedules.length;
  const totalDay = daySchedules.length;

  if (role === 'administrator') return <AccessDenied title="Program Privat" />;

  return (
    <div className="flex flex-col flex-1" onClick={() => activeMenu !== null && setActiveMenu(null)}>

      {/* ── Animated Banner ───────────────────────────────── */}
      <PageBanner
        icon={CalendarDays}
        title="Program Privat"
        subtitle={
          (isStudent ? 'Orarul tău fix' : 'Orarul fix al elevilor') +
          ' — se repetă în fiecare săptămână, până e schimbat de aici'
        }
        accent="#5934DC"
        right={<>
          <StatBadge label={DAY_LABELS[selectedDayIdx]} value={totalDay} color="bg-white/20 text-white" />
          <StatBadge label="Total activ" value={totalActive} color="bg-brand-300/30 text-white" />
        </>}
      />

      {/* ── Mobile stats ─────────────────────────────────── */}
      <div className="flex sm:hidden gap-3 px-4 pt-4">
        <MobileStat label={DAY_LABELS[selectedDayIdx]} value={totalDay} color="bg-slate-800 text-white" />
        <MobileStat label="Total activ" value={totalActive} color="bg-brand-600 text-white" />
      </div>

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">

        {/* ── Search ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <input
            value={searchStudent}
            onChange={e => setSearchStudent(e.target.value)}
            placeholder="Caută elev…"
            className="w-full max-w-xs px-3.5 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* ── Calendar grid ────────────────────────────────── */}
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
                        const cellKey = `${col.id}|${time}`;
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
                            {cellSchedules.map(s => {
                              const isDragging = draggingId === s.id;
                              const isMenu     = activeMenu === s.id;
                              return (
                                <div
                                  key={s.id}
                                  draggable={!isStudent}
                                  onDragStart={isStudent ? undefined : e => {
                                    setDraggingId(s.id);
                                    setActiveMenu(null);
                                    e.dataTransfer.effectAllowed = 'move';
                                    try { e.dataTransfer.setData('text/plain', String(s.id)); } catch {}
                                  }}
                                  onDragEnd={isStudent ? undefined : () => { setDraggingId(null); setDropCell(null); }}
                                  onClick={isStudent ? undefined : e => { e.stopPropagation(); setActiveMenu(isMenu ? null : s.id); }}
                                  className={`relative text-sm px-3 py-2.5 rounded-lg border mb-1 last:mb-0 select-none bg-brand-50 border-brand-300 text-brand-800 ${isStudent ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
                                    transition-all duration-150
                                    ${isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md'}
                                    ${isMenu ? 'ring-2 ring-brand-400 shadow-lg' : ''}`}
                                >
                                  <div className="flex items-start gap-1.5">
                                    <GripVertical className="w-3.5 h-3.5 mt-0.5 opacity-40 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold truncate">{s.student_name}</p>
                                      <p className="truncate text-xs mt-0.5">
                                        <span className="font-semibold" style={{ color: 'inherit' }}>{s.discipline || '—'}</span>
                                        <span className="opacity-70"> · {s.teacher_name}</span>
                                      </p>
                                    </div>
                                  </div>

                                  {!isStudent && isMenu && (
                                    <div
                                      onClick={e => e.stopPropagation()}
                                      className="absolute z-30 left-0 top-full mt-1 flex items-center gap-1 px-1.5 py-1 rounded-xl bg-white border border-gray-200 shadow-2xl animate-fade-in"
                                    >
                                      <button
                                        onClick={() => { setEditSchedule(s); setActiveMenu(null); setShowForm(true); }}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                                      ><Pencil className="w-3 h-3" /> Editează</button>
                                      <button
                                        onClick={() => { setDeleteTarget(s); setActiveMenu(null); }}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                      ><Trash2 className="w-3 h-3" /> Șterge</button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {!isStudent && cellSchedules.length === 0 && (
                              <button
                                onClick={() => openAddSlot(selectedDow, time, typeof col.id === 'number' ? col.id : undefined)}
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
          <span>Orarul de mai sus e fix — rămâne neschimbat săptămână de săptămână, indiferent de zi/lună/an, până când îl modifici sau ștergi de aici.</span>
          {!isStudent && <span className="ml-auto text-[11px] opacity-50 italic hidden sm:inline">Trage pentru altă oră/cabinet · Click pentru editare</span>}
        </div>
      </main>

      <RecurringScheduleForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditSchedule(null); }}
        onSaved={() => mutate()}
        schedule={editSchedule}
        defaultDayOfWeek={addDow}
        defaultStartTime={addTime}
        defaultCabinetId={addCabinetId}
        showToast={toast}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge orarul" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Elimină din program orarul fix al lui <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.student_name}</strong>
          {deleteTarget && <> din {DAY_LABELS[(deleteTarget.day_of_week + 6) % 7]} la {deleteTarget.start_time?.slice(0, 5)}</>}?
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
