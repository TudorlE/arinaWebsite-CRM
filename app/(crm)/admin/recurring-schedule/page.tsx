'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Repeat, Plus, Pencil, Trash2, Sparkles, Power } from 'lucide-react';
import RecurringScheduleForm from '@/components/recurring-schedule/RecurringScheduleForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { RecurringSchedule, DAYS_OF_WEEK } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RecurringSchedulePage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);

  const { toasts, toast, remove } = useToast();
  const { data, mutate, isLoading } = useSWR('/api/recurring-schedules', fetcher);
  const schedules: RecurringSchedule[] = data?.schedules ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringSchedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringSchedule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generateTarget, setGenerateTarget] = useState<RecurringSchedule | null>(null);
  const [generating, setGenerating] = useState(false);

  const isAdmin = role === 'admin';

  if (role && !isAdmin) {
    return (
      <div className="flex flex-col flex-1">
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-600 to-accent-600 px-8 py-6 shadow-lg">
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><Repeat className="w-7 h-7 text-white" /></div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Orar Fix</h1>
              <p className="text-brand-200 text-sm font-medium mt-0.5">Acces restricționat</p>
            </div>
          </div>
        </div>
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Doar administratorii pot gestiona orarul fix.</p>
        </main>
      </div>
    );
  }

  const handleToggleActive = async (s: RecurringSchedule) => {
    mutate({ schedules: schedules.map(x => x.id === s.id ? { ...x, active: !x.active } : x) }, false);
    await fetch(`/api/recurring-schedules/${s.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !s.active }),
    });
    mutate();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/recurring-schedules/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast(`Orar fix dezactivat · ${data.deleted} lecții viitoare șterse${data.skipped ? `, ${data.skipped} păstrate (au prezență înregistrată)` : ''}`, 'success');
        mutate();
      } else {
        toast(data.error ?? 'Eroare la ștergere', 'error');
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleGenerate = async (months: 3 | 6 | 12) => {
    if (!generateTarget) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/recurring-schedules/${generateTarget.id}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ months }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`${data.inserted} lecții generate pentru următoarele ${months} luni`, 'success');
        mutate();
        setGenerateTarget(null);
      } else {
        toast(data.error ?? 'Eroare la generare', 'error');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-600 to-accent-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><Repeat className="w-7 h-7 text-white" /></div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Orar Fix</h1>
            <p className="text-brand-200 text-sm font-medium mt-0.5">Lecții recurente — se repetă automat în fiecare săptămână</p>
          </div>
          <Button onClick={() => { setEditTarget(null); setShowForm(true); }}>
            <Plus className="w-4 h-4" /> Orar fix nou
          </Button>
        </div>
      </div>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Se încarcă…</div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Repeat className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Niciun orar fix încă</p>
              <p className="text-xs mt-1">Adaugă primul orar recurent pentru un elev.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {schedules.map(s => (
                <div key={s.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${!s.active ? 'opacity-50' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/40`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{s.student_name}</p>
                      <span className="text-xs text-slate-400">cu</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{s.teacher_name}</p>
                      {s.discipline && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                          {s.discipline}
                        </span>
                      )}
                      {!s.active && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Inactiv
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{DAYS_OF_WEEK[s.day_of_week]}</span>
                      <span>{s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}</span>
                      {s.cabinet_name && <span>{s.cabinet_name}</span>}
                      {s.generated_until && <span>generat până la {s.generated_until}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => handleToggleActive(s)} title={s.active ? 'Dezactivează' : 'Activează'}>
                      <Power className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setGenerateTarget(s)}>
                      <Sparkles className="w-3.5 h-3.5" /> Generează
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { setEditTarget(s); setShowForm(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(s)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <RecurringScheduleForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => mutate()}
        schedule={editTarget}
        showToast={toast}
      />

      <Modal open={!!generateTarget} onClose={() => setGenerateTarget(null)} title="Generează lecții" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Generează lecțiile viitoare pentru <strong className="text-slate-900 dark:text-slate-100">{generateTarget?.student_name}</strong> ({DAYS_OF_WEEK[generateTarget?.day_of_week ?? 0]}, {generateTarget?.start_time?.slice(0, 5)}). Regenerarea e sigură — lecțiile deja generate nu se duplică.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[3, 6, 12].map(m => (
            <Button key={m} variant="secondary" disabled={generating} onClick={() => handleGenerate(m as 3 | 6 | 12)}>
              {generating ? '…' : `${m} luni`}
            </Button>
          ))}
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge orarul fix" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Șterge complet orarul fix pentru <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.student_name}</strong>?
          Toate lecțiile viitoare generate vor fi șterse (cele cu prezență deja înregistrată sunt păstrate), iar orarul va fi dezactivat. Lecțiile trecute rămân neatinse.
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
