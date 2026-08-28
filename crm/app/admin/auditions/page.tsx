'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Mic2, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import AuditionForm from '@/components/auditions/AuditionForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Audition } from '@/lib/types';
import { DEFAULT_TIME_SLOTS } from '@/lib/timeSlots';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const DAY_LABELS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

function todayDayIdx(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
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

export default function AuditionsPage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);
  const canEdit = role === 'admin' || role === 'teacher';

  const reference = new Date();
  const [showForm, setShowForm]   = useState(false);
  const [addDate, setAddDate]     = useState('');
  const [addTime, setAddTime]     = useState('');
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayDayIdx());
  const [editAudition, setEditAudition] = useState<Audition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Audition | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [activeMenu, setActiveMenu]     = useState<number | null>(null);
  const [draggingId, setDraggingId]     = useState<number | null>(null);
  const [dropTime, setDropTime]         = useState<string | null>(null);
  const { toasts, toast, remove } = useToast();

  const weekDates = getWeekDates(reference);

  const { data: allData, mutate } = useSWR('/api/auditions', fetcher);
  const allAuditions: Audition[] = allData?.auditions ?? [];

  const selectedDate = fmtDate(weekDates[selectedDayIdx]);
  const dayAuditions = allAuditions.filter(a => a.date === selectedDate);

  const byTime: Record<string, Audition[]> = {};
  for (const a of dayAuditions) {
    const t = (a.time ?? '').slice(0, 5);
    (byTime[t] ??= []).push(a);
  }
  const extraSlots = Array.from(new Set(dayAuditions.map(a => (a.time ?? '').slice(0, 5))))
    .filter(t => t && !DEFAULT_TIME_SLOTS.includes(t));
  const timeSlots = [...DEFAULT_TIME_SLOTS, ...extraSlots].sort();

  const openAddAudition = (time: string) => {
    setAddDate(selectedDate);
    setAddTime(time);
    setShowForm(true);
  };

  const handleDrop = async (time: string) => {
    const id = draggingId;
    setDraggingId(null);
    setDropTime(null);
    if (!id) return;
    const audition = allAuditions.find(a => a.id === id);
    if (!audition || audition.time?.slice(0, 5) === time) return;

    mutate({ auditions: allAuditions.map(a => a.id === id ? { ...a, time } : a) }, false);

    const res = await fetch(`/api/auditions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time }),
    });
    if (!res.ok) { toast('Eroare la mutare', 'error'); mutate(); }
    else { toast('Audiție mutată', 'success'); mutate(); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/auditions/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast('Audiție ștearsă', 'success'); mutate(); }
      else toast('Eroare la ștergere', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const todayStr = fmtDate(new Date());
  const weekAuditions = allAuditions.filter(a => a.date >= fmtDate(weekDates[0]) && a.date <= fmtDate(weekDates[6]));
  const totalWeek = weekAuditions.length;
  const scheduled = weekAuditions.filter(a => a.status === 'scheduled').length;
  const completed = weekAuditions.filter(a => a.status === 'completed').length;

  return (
    <div className="flex flex-col flex-1" onClick={() => activeMenu !== null && setActiveMenu(null)}>

      {/* ── Animated Banner ───────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-accent-600 via-accent-600 to-brand-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Mic2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Audiții — pe zile</h1>
            <p className="text-accent-200 text-sm font-medium mt-0.5">Lecții de probă, independente de elevi și profesori</p>
          </div>
          <div className="ml-auto hidden sm:flex gap-3">
            <StatBadge label="Total"      value={totalWeek} color="bg-white/20 text-white" />
            <StatBadge label="Programate" value={scheduled} color="bg-accent-300/30 text-white" />
            <StatBadge label="Finalizate" value={completed} color="bg-emerald-300/30 text-white" />
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">

        {/* ── Day tabs — bigger ─────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5">
          {DAY_LABELS.map((label, i) => {
            const d = weekDates[i];
            const isToday = fmtDate(d) === todayStr;
            const isSelected = i === selectedDayIdx;
            return (
              <button
                key={label}
                onClick={() => setSelectedDayIdx(i)}
                className={`flex flex-col items-center gap-0.5 px-6 py-3.5 rounded-2xl text-base font-bold transition-colors duration-150
                  ${isSelected ? 'bg-accent-600 text-white shadow-md' : isToday ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-accent-300'}`}
              >
                {label}
                <span className={`text-xs font-medium ${isSelected ? 'text-accent-100' : 'text-slate-400'}`}>{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* ── Simple calendar — Ora | Audiții ────────────────── */}
        <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full border-collapse">
            <tbody>
              {timeSlots.map(time => {
                const cellAuditions = byTime[time] ?? [];
                const isDropTarget = dropTime === time && draggingId !== null;
                return (
                  <tr key={time}>
                    <td className="border border-gray-200 dark:border-slate-800 px-4 py-5 text-base font-mono font-semibold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/60 whitespace-nowrap w-28 align-top">
                      {time}
                    </td>
                    <td
                      onDragOver={e => { if (!canEdit || draggingId === null) return; e.preventDefault(); if (dropTime !== time) setDropTime(time); }}
                      onDragLeave={() => { if (dropTime === time) setDropTime(null); }}
                      onDrop={e => { if (!canEdit) return; e.preventDefault(); handleDrop(time); }}
                      className={`group relative border border-gray-200 dark:border-slate-800 px-3 py-3 align-top transition-colors duration-150 min-h-[64px]
                        ${isDropTarget ? 'bg-accent-50 dark:bg-accent-900/20 ring-2 ring-accent-400 ring-inset' : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'}`}
                    >
                      <div className="flex flex-wrap gap-2">
                        {cellAuditions.map(a => {
                          const isDragging = draggingId === a.id;
                          const isMenu = activeMenu === a.id;
                          const statusStyle =
                            a.status === 'completed' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                            a.status === 'cancelled' ? 'bg-gray-100 border-gray-300 text-gray-400 line-through' :
                            a.status === 'no_show' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                            'bg-accent-50 border-accent-300 text-accent-800';
                          return (
                            <div
                              key={a.id}
                              draggable={canEdit}
                              onDragStart={!canEdit ? undefined : e => {
                                setDraggingId(a.id);
                                setActiveMenu(null);
                                e.dataTransfer.effectAllowed = 'move';
                                try { e.dataTransfer.setData('text/plain', String(a.id)); } catch {}
                              }}
                              onDragEnd={!canEdit ? undefined : () => { setDraggingId(null); setDropTime(null); }}
                              onClick={!canEdit ? undefined : e => { e.stopPropagation(); setActiveMenu(isMenu ? null : a.id); }}
                              className={`relative text-sm px-3.5 py-2.5 rounded-lg border select-none min-w-[200px] ${!canEdit ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
                                transition-all duration-150 ${statusStyle}
                                ${isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md'}
                                ${isMenu ? 'ring-2 ring-accent-400 shadow-lg' : ''}`}
                            >
                              <div className="flex items-start gap-1.5">
                                <GripVertical className="w-3.5 h-3.5 mt-0.5 opacity-40 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold truncate">{a.candidate_name}</p>
                                  <p className="truncate text-xs mt-0.5 opacity-70">{a.discipline || 'fără disciplină'}</p>
                                </div>
                              </div>

                              {canEdit && isMenu && (
                                <div
                                  onClick={e => e.stopPropagation()}
                                  className="absolute z-30 left-0 top-full mt-1 flex items-center gap-1 px-1.5 py-1 rounded-xl bg-white border border-gray-200 shadow-2xl animate-fade-in"
                                >
                                  <button
                                    onClick={() => { setEditAudition(a); setActiveMenu(null); }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-accent-600 hover:bg-accent-50 transition-colors"
                                  ><Pencil className="w-3 h-3" /> Editează</button>
                                  <button
                                    onClick={() => { setDeleteTarget(a); setActiveMenu(null); }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                  ><Trash2 className="w-3 h-3" /> Șterge</button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {canEdit && (
                          <button
                            onClick={() => openAddAudition(time)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-1 px-3.5 py-2.5 rounded-lg border border-dashed border-accent-300 text-accent-500 text-xs font-semibold hover:bg-accent-50"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adaugă
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Legend ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pb-1">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-accent-500" />Programat</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500" />Finalizat</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-amber-400" />Neprezentare</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-slate-400" />Anulat</span>
          {canEdit && <span className="ml-auto text-[11px] opacity-50 italic hidden sm:inline">Trage audiția la altă oră · Click pentru editare</span>}
        </div>
      </main>

      <AuditionForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => mutate()}
        defaultDate={addDate}
        defaultTime={addTime}
        showToast={toast}
      />

      <AuditionForm
        open={!!editAudition}
        onClose={() => setEditAudition(null)}
        onSaved={() => mutate()}
        audition={editAudition}
        showToast={toast}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge audiția" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Șterge audiția lui <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.candidate_name}</strong>
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

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex flex-col items-center px-4 py-2 rounded-2xl ${color}`}>
      <span className="text-2xl font-extrabold leading-none">{value}</span>
      <span className="text-xs font-medium opacity-80 mt-0.5">{label}</span>
    </div>
  );
}
