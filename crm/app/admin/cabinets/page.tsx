'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import {
  DoorOpen, Plus, Pencil, Trash2, Settings2, X, Check, UserRound, Lock, Unlock,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Cabinet, CabinetTeacherAssignment, CabinetDayStatus } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const DAYS_RO = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
// Displayed Monday-first, matching how the studio's week is organized.
const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6, 0];

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

  const [selectedDow, setSelectedDow] = useState(new Date().getDay());

  // Cabinet management modal state
  const [showManage, setShowManage] = useState(false);
  const [managingCabinet, setManagingCabinet] = useState<Cabinet | null>(null);
  const [cabinetForm, setCabinetForm] = useState({ name: '', color: '#6366f1' });
  const [savingCabinet, setSavingCabinet] = useState(false);
  const [deletingCabinetId, setDeletingCabinetId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { toasts, toast, remove } = useToast();

  const { data: cabData, mutate: mutateCabs } = useSWR('/api/cabinets', fetcher);
  const { data: teachersData } = useSWR('/api/teachers', fetcher);

  const cabinets: Cabinet[] = cabData?.cabinets ?? [];
  const allAssignments: CabinetTeacherAssignment[] = (cabData?.assignments ?? []).map((a: CabinetTeacherAssignment & { teachers?: { name: string } | null }) => ({
    ...a,
    teacher_name: (a as unknown as { teachers?: { name: string } | null }).teachers?.name ?? a.teacher_name ?? null,
  }));
  const dayStatuses: CabinetDayStatus[] = cabData?.dayStatuses ?? [];
  const teachers: { id: number; name: string }[] = teachersData?.teachers ?? [];

  const getAssignment = useCallback(
    (cabinetId: number, dow: number) =>
      allAssignments.find(a => a.cabinet_id === cabinetId && a.day_of_week === dow) ?? null,
    [allAssignments],
  );

  const getDayStatus = useCallback(
    (cabinetId: number, dow: number) =>
      dayStatuses.find(s => s.cabinet_id === cabinetId && s.day_of_week === dow)?.status ?? 'liber',
    [dayStatuses],
  );

  // ── Cabinet CRUD ─────────────────────────────────────────────────────────────
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

  const setTeacherAssignment = async (cabinetId: number, dow: number, teacherId: number | null) => {
    await fetch(`/api/cabinets/${cabinetId}/assignments`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: dow, teacher_id: teacherId }),
    });
    mutateCabs();
  };

  // ── Ocupat / Liber — editabil oricând, fără blocare după salvare ───────────
  const toggleDayStatus = async (cabinetId: number, dow: number, current: 'liber' | 'ocupat') => {
    const next = current === 'liber' ? 'ocupat' : 'liber';
    setTogglingId(cabinetId);
    try {
      const res = await fetch(`/api/cabinets/${cabinetId}/day-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: dow, status: next }),
      });
      if (res.ok) mutateCabs();
      else toast('Eroare la salvare', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="flex flex-col flex-1">

      {/* ── Header banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-accent-600 to-brand-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <DoorOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Cabinete General</h1>
            <p className="text-accent-200 text-sm font-medium mt-0.5">
              Șablon recurent pe zilele săptămânii — profesor alocat și status Ocupat/Liber
            </p>
          </div>
          <div className="ml-auto flex gap-3">
            <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-white/20 text-white">
              <span className="text-2xl font-extrabold leading-none">{cabinets.length}</span>
              <span className="text-xs font-medium opacity-80 mt-0.5">Cabinete</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">

        {/* ── Day tabs (recurring, no date) ────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
            {DISPLAY_DAYS.map(dow => {
              const isSelected = dow === selectedDow;
              return (
                <button
                  key={dow}
                  onClick={() => setSelectedDow(dow)}
                  className={`flex-shrink-0 px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95
                    ${isSelected
                      ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/40'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700'}`}
                >
                  {DAYS_RO[dow]}
                </button>
              );
            })}
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowManage(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-md hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-200 hover:scale-105"
            >
              <Settings2 className="w-4 h-4" />
              Gestionare
            </button>
          )}
        </div>

        {/* ── No cabinets state ───────────────────────────────────────── */}
        {cabinets.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <DoorOpen className="w-10 h-10 text-brand-400" />
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

        {/* ── Cabinets for the selected day ────────────────────────────── */}
        {cabinets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cabinets.map(cab => {
              const asgn = getAssignment(cab.id, selectedDow);
              const status = getDayStatus(cab.id, selectedDow);
              const isOcupat = status === 'ocupat';
              return (
                <div key={cab.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: cab.color }} />
                    <p className="font-bold text-slate-800 dark:text-slate-100 flex-1">{cab.name}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isOcupat ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                      {isOcupat ? 'Ocupat' : 'Liber'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <UserRound className="w-3.5 h-3.5 flex-shrink-0" />
                    {asgn?.teacher_name ? (
                      <span className="font-semibold" style={{ color: cab.color }}>{asgn.teacher_name}</span>
                    ) : (
                      <span className="italic">Fără profesor alocat</span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => toggleDayStatus(cab.id, selectedDow, status)}
                      disabled={togglingId === cab.id}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all
                        ${isOcupat
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'}`}
                    >
                      {isOcupat ? <><Unlock className="w-4 h-4" /> Marchează Liber</> : <><Lock className="w-4 h-4" /> Marchează Ocupat</>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Legend ─────────────────────────────────────────────────── */}
        {cabinets.length > 0 && (
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pb-1">
            <span className="ml-auto text-[11px] opacity-60 italic">
              Rezervarea lecțiilor se face din Program General sau Orar Fix — aici doar statusul Ocupat/Liber pe zi.
            </span>
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
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
                              className="w-full px-1.5 py-1 text-[11px] rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-400"
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

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
