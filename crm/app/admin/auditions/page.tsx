'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Mic2, Plus, Pencil, Trash2, Search, CalendarDays, List } from 'lucide-react';
import AuditionForm from '@/components/auditions/AuditionForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Audition, INSTRUMENTS } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const STATUS_BADGE: Record<string, 'blue' | 'green' | 'gray' | 'red'> = {
  scheduled: 'blue', completed: 'green', cancelled: 'gray', no_show: 'red',
};
const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programată', completed: 'Finalizată', cancelled: 'Anulată', no_show: 'Neprezentare',
};

function fmtDate(s: string) {
  try { return new Date(s + 'T00:00:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return s; }
}

export default function AuditionsPage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => { fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {}); }, []);
  const isReadOnly = role === 'student';

  const { toasts, toast, remove } = useToast();
  const [search, setSearch] = useState('');
  const [fDiscipline, setFDiscipline] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (fDiscipline) params.set('discipline', fDiscipline);
  if (fStatus) params.set('status', fStatus);

  const { data, mutate, isLoading } = useSWR(`/api/auditions?${params.toString()}`, fetcher);
  const auditions: Audition[] = data?.auditions ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Audition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Audition | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/auditions/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast('Audiție ștearsă', 'success'); mutate(); }
      else { const d = await res.json(); toast(d.error ?? 'Eroare la ștergere', 'error'); }
    } finally {
      setDeleting(false); setDeleteTarget(null);
    }
  };

  const byMonth = auditions.reduce<Record<string, Audition[]>>((acc, a) => {
    const key = a.date.slice(0, 7);
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="flex flex-col flex-1">
      <div className="relative overflow-hidden bg-gradient-to-r from-accent-600 via-accent-600 to-brand-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><Mic2 className="w-7 h-7 text-white" /></div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Audition Schedule</h1>
            <p className="text-accent-200 text-sm font-medium mt-0.5">{auditions.length} audiții · gestionate independent de programul obișnuit</p>
          </div>
          {!isReadOnly && (
            <Button onClick={() => { setEditTarget(null); setShowForm(true); }}>
              <Plus className="w-4 h-4" /> Audiție nouă
            </Button>
          )}
        </div>
      </div>

      <main className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută elev…"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="w-40"><Select value={fDiscipline} onChange={e => setFDiscipline(e.target.value)} placeholder="Disciplină" options={INSTRUMENTS.map(i => ({ value: i, label: i }))} /></div>
          <div className="w-40"><Select value={fStatus} onChange={e => setFStatus(e.target.value)} placeholder="Status" options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))} /></div>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500'}`}><List className="w-3.5 h-3.5" /> Listă</button>
            <button onClick={() => setViewMode('calendar')} className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 ${viewMode === 'calendar' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500'}`}><CalendarDays className="w-3.5 h-3.5" /> Calendar</button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Se încarcă…</div>
        ) : auditions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Mic2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Nicio audiție programată</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {auditions.map(a => (
              <div key={a.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{a.student_name}</p>
                    {a.discipline && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{a.discipline}</span>}
                    <Badge variant={STATUS_BADGE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{fmtDate(a.date)} · {a.time?.slice(0, 5)}</span>
                    <span>{a.duration} min</span>
                    {a.teacher_name && <span>{a.teacher_name}</span>}
                  </div>
                  {a.result && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">Rezultat: {a.result}</p>}
                </div>
                {!isReadOnly && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => { setEditTarget(a); setShowForm(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(a)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(byMonth).map(([month, items]) => (
              <div key={month} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {new Date(month + '-01').toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map(a => (
                    <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-14 text-center flex-shrink-0">
                        <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200">{a.date.slice(8, 10)}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{a.time?.slice(0, 5)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.student_name} {a.discipline ? `· ${a.discipline}` : ''}</p>
                        <p className="text-xs text-slate-400">{a.teacher_name ?? 'Fără profesor asignat'}</p>
                      </div>
                      <Badge variant={STATUS_BADGE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AuditionForm open={showForm} onClose={() => setShowForm(false)} onSaved={() => mutate()} audition={editTarget} showToast={toast} />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge audiția" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Șterge audiția lui <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.student_name}</strong> din {deleteTarget && fmtDate(deleteTarget.date)}?
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
