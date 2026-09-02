'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Mic2, Plus, Pencil, Trash2, GripVertical, Check, X } from 'lucide-react';
import AuditionForm from '@/components/auditions/AuditionForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Audition } from '@/lib/types';
import { DEFAULT_TIME_SLOTS } from '@/lib/timeSlots';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const DAY_LABELS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

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
  const [editAudition, setEditAudition] = useState<Audition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Audition | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [activeMenu, setActiveMenu]     = useState<number | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<number | null>(null);
  const [draggingId, setDraggingId]     = useState<number | null>(null);
  const [dropCell, setDropCell]         = useState<string | null>(null);
  const { toasts, toast, remove } = useToast();

  const weekDates = getWeekDates(reference);
  const from = fmtDate(weekDates[0]);
  const to   = fmtDate(weekDates[6]);

  const { data: allData, mutate } = useSWR('/api/auditions', fetcher);
  const allAuditions: Audition[] = allData?.auditions ?? [];
  const weekAuditions = allAuditions.filter(a => a.date >= from && a.date <= to);

  const byDayTime: Record<string, Audition[]> = {};
  for (const a of weekAuditions) {
    const key = `${a.date}|${(a.time ?? '').slice(0, 5)}`;
    (byDayTime[key] ??= []).push(a);
  }
  const extraSlots = Array.from(new Set(weekAuditions.map(a => (a.time ?? '').slice(0, 5))))
    .filter(t => t && !DEFAULT_TIME_SLOTS.includes(t));
  const timeSlots = [...DEFAULT_TIME_SLOTS, ...extraSlots].sort();

  const openAddAudition = (dateStr: string, time: string) => {
    setAddDate(dateStr);
    setAddTime(time);
    setShowForm(true);
  };

  const handleDrop = async (dateStr: string, time: string) => {
    const id = draggingId;
    setDraggingId(null);
    setDropCell(null);
    if (!id) return;
    const audition = allAuditions.find(a => a.id === id);
    if (!audition) return;
    if (audition.date === dateStr && audition.time?.slice(0, 5) === time) return;

    mutate({ auditions: allAuditions.map(a => a.id === id ? { ...a, date: dateStr, time } : a) }, false);

    const res = await fetch(`/api/auditions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, time }),
    });
    if (!res.ok) { toast('Eroare la mutare', 'error'); mutate(); }
    else { toast('Audiție mutată', 'success'); mutate(); }
  };

  const setQuickStatus = async (audition: Audition, status: 'completed' | 'no_show') => {
    setSavingStatusId(audition.id);
    try {
      const res = await fetch(`/api/auditions/${audition.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      if (res.ok) { toast('Status actualizat', 'success'); mutate(); }
      else toast('Eroare la salvare', 'error');
    } finally {
      setSavingStatusId(null);
      setActiveMenu(null);
    }
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
  const totalWeek = weekAuditions.length;
  const scheduled = weekAuditions.filter(a => a.status === 'scheduled').length;
  const completed = weekAuditions.filter(a => a.status === 'completed').length;

  return (
    <div className="flex flex-col flex-1" onClick={() => activeMenu !== null && setActiveMenu(null)}>

      {/* ── Animated Banner — teal/cyan, distinct from Program Privat (violet) & Registru (amber) ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Mic2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Audiții — săptămâna aceasta</h1>
            <p className="text-cyan-100 text-sm font-medium mt-0.5">Lecții de probă, independente de elevi și profesori</p>
          </div>
          <div className="ml-auto hidden sm:flex gap-3">
            <StatBadge label="Total"      value={totalWeek} color="bg-white/20 text-white" />
            <StatBadge label="Programate" value={scheduled} color="bg-cyan-300/30 text-white" />
            <StatBadge label="Finalizate" value={completed} color="bg-emerald-300/30 text-white" />
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">

        {/* ── Full week grid — Ora × Zilele săptămânii ───────── */}
        <div className="flex-1 overflow-auto rounded-2xl border border-cyan-200 dark:border-cyan-900/40 bg-white dark:bg-slate-900 shadow-sm">
          <table className="border-collapse" style={{ minWidth: 150 + weekDates.length * 270 }}>
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900/40 px-5 py-5 text-base font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300 text-left" style={{ minWidth: 130, width: 130 }}>
                  Ora
                </th>
                {weekDates.map((d, i) => {
                  const dateStr = fmtDate(d);
                  const isToday = dateStr === todayStr;
                  return (
                    <th
                      key={dateStr}
                      className={`sticky top-0 z-10 border-2 border-cyan-200 dark:border-cyan-900/40 px-5 py-5 text-center font-bold
                        ${isToday ? 'bg-cyan-200 dark:bg-cyan-800/60' : 'bg-cyan-50 dark:bg-cyan-950/40'}`}
                      style={{ minWidth: 270, width: 270 }}
                    >
                      <div className="text-base uppercase tracking-wide text-cyan-800 dark:text-cyan-200">{DAY_LABELS[i]}</div>
                      <div className="text-sm font-medium text-cyan-600/70 dark:text-cyan-400/70 mt-0.5">{d.getDate()} {d.toLocaleDateString('ro-RO', { month: 'short' })}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time}>
                  <td className="border border-gray-200 dark:border-slate-800 px-5 py-6 text-lg font-mono font-semibold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/60 whitespace-nowrap align-top">
                    {time}
                  </td>
                  {weekDates.map(d => {
                    const dateStr = fmtDate(d);
                    const cellKey = `${dateStr}|${time}`;
                    const cellAuditions = byDayTime[cellKey] ?? [];
                    const isDropTarget = dropCell === cellKey && draggingId !== null;
                    const isToday = dateStr === todayStr;
                    return (
                      <td
                        key={dateStr}
                        onDragOver={e => { if (!canEdit || draggingId === null) return; e.preventDefault(); if (dropCell !== cellKey) setDropCell(cellKey); }}
                        onDragLeave={() => { if (dropCell === cellKey) setDropCell(null); }}
                        onDrop={e => { if (!canEdit) return; e.preventDefault(); handleDrop(dateStr, time); }}
                        className={`group relative border-2 border-gray-200 dark:border-slate-800 px-3 py-3 align-top transition-colors duration-150 min-h-[80px]
                          ${isDropTarget ? 'bg-cyan-50 dark:bg-cyan-900/20 ring-2 ring-cyan-400 ring-inset' : isToday ? 'bg-cyan-50/30 dark:bg-cyan-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'}`}
                      >
                        <div className="flex flex-col gap-2">
                          {cellAuditions.map(a => {
                            const isDragging = draggingId === a.id;
                            const isMenu = activeMenu === a.id;
                            const statusStyle =
                              a.status === 'completed' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                              a.status === 'cancelled' ? 'bg-gray-100 border-gray-300 text-gray-400 line-through' :
                              a.status === 'no_show' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                              'bg-cyan-50 border-cyan-300 text-cyan-800';
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
                                onDragEnd={!canEdit ? undefined : () => { setDraggingId(null); setDropCell(null); }}
                                onClick={!canEdit ? undefined : e => { e.stopPropagation(); setActiveMenu(isMenu ? null : a.id); }}
                                className={`relative text-base px-4 py-3.5 rounded-lg border select-none ${!canEdit ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
                                  transition-all duration-150 ${statusStyle}
                                  ${isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md'}
                                  ${isMenu ? 'ring-2 ring-cyan-400 shadow-lg' : ''}`}
                              >
                                <div className="flex items-start gap-2">
                                  <GripVertical className="w-4 h-4 mt-0.5 opacity-40 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold truncate">{a.candidate_name}</p>
                                    <p className="truncate text-sm mt-0.5 opacity-70">{a.discipline || 'fără disciplină'}</p>
                                  </div>
                                </div>

                                {canEdit && isMenu && (
                                  <div
                                    onClick={e => e.stopPropagation()}
                                    className="absolute z-30 left-0 top-full mt-1 flex flex-col gap-1 px-1.5 py-1.5 rounded-xl bg-white border border-gray-200 shadow-2xl animate-fade-in min-w-[168px]"
                                  >
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => setQuickStatus(a, 'completed')}
                                        disabled={savingStatusId === a.id}
                                        title="Finalizată — s-a făcut"
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                      ><Check className="w-3.5 h-3.5" /></button>
                                      <button
                                        onClick={() => setQuickStatus(a, 'no_show')}
                                        disabled={savingStatusId === a.id}
                                        title="Neprezentare — nu s-a făcut"
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                                      ><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <div className="w-full h-px bg-slate-100" />
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => { setEditAudition(a); setActiveMenu(null); }}
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-cyan-600 hover:bg-cyan-50 transition-colors"
                                      ><Pencil className="w-3 h-3" /> Editează</button>
                                      <button
                                        onClick={() => { setDeleteTarget(a); setActiveMenu(null); }}
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                      ><Trash2 className="w-3 h-3" /> Șterge</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {canEdit && (
                            <button
                              onClick={() => openAddAudition(dateStr, time)}
                              className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-1.5 py-3 rounded-lg border border-dashed border-cyan-300 text-cyan-500 text-sm font-semibold hover:bg-cyan-50"
                            >
                              <Plus className="w-4 h-4" /> Adaugă
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Legend ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pb-1">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-cyan-500" />Programat</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500" />Finalizat</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-amber-400" />Neprezentare</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-slate-400" />Anulat</span>
          {canEdit && <span className="ml-auto text-[11px] opacity-50 italic hidden sm:inline">Trage audiția în altă zi/oră · Click pentru marcaj rapid sau editare</span>}
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
