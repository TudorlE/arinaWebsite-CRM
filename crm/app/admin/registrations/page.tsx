'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Globe, Phone, Mail, BookOpen, MessageSquare, Check, X, Clock, UserPlus, Trash2 } from 'lucide-react';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Registration } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const STATUS_CONFIG = {
  nou:       { label: 'Nou',       color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  icon: Clock },
  contactat: { label: 'Contactat', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: Phone },
  inscris:   { label: 'Înscris',   color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: Check },
  anulat:    { label: 'Anulat',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    icon: X },
};

const COURSE_EMOJI: Record<string, string> = {
  Pian: '🎹', Tobe: '🥁', Canto: '🎤', Solfegiu: '🎼', Chitară: '🎸',
};

export default function RegistrationsPage() {
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, toast, remove } = useToast();

  const { data, mutate } = useSWR(
    `/api/registrations${filterStatus ? `?status=${filterStatus}` : ''}`,
    fetcher,
    { refreshInterval: 30000 },
  );

  const registrations: Registration[] = data?.registrations ?? [];

  const counts = {
    total: registrations.length,
    nou: registrations.filter(r => r.status === 'nou').length,
    contactat: registrations.filter(r => r.status === 'contactat').length,
    inscris: registrations.filter(r => r.status === 'inscris').length,
    anulat: registrations.filter(r => r.status === 'anulat').length,
  };

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/registrations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast(`Status actualizat: ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}`, 'success');
      mutate();
    } else {
      toast('Eroare la actualizare', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/registrations/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteTarget(null);
    if (res.ok) { toast('Cerere ștearsă', 'success'); mutate(); }
    else toast('Eroare la ștergere', 'error');
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col flex-1">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Cereri de pe Site</h1>
            <p className="text-indigo-200 text-sm font-medium mt-0.5">Înregistrări primite prin formularul de pe arryproduction.ro</p>
          </div>
          <div className="ml-auto flex gap-3">
            <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-white/20 text-white">
              <span className="text-2xl font-extrabold leading-none">{data?.registrations?.length ?? '—'}</span>
              <span className="text-xs font-medium opacity-80 mt-0.5">Total</span>
            </div>
            <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-white/20 text-white">
              <span className="text-2xl font-extrabold leading-none">{data?.registrations?.filter((r: Registration) => r.status === 'nou').length ?? '—'}</span>
              <span className="text-xs font-medium opacity-80 mt-0.5">Noi</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 overflow-auto">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: '', label: 'Toate', count: data?.registrations?.length ?? 0 },
            ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label, count: data?.registrations?.filter((r: Registration) => r.status === k).length ?? 0 })),
          ].map(f => (
            <button key={f.value} onClick={() => setFilterStatus(f.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${filterStatus === f.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'}`}>
              {f.label}
              <span className={`min-w-5 h-5 px-1.5 rounded-full text-xs flex items-center justify-center font-bold ${filterStatus === f.value ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Cards */}
        {registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <UserPlus className="w-10 h-10 text-indigo-300" />
            </div>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
              {filterStatus ? 'Nicio cerere cu acest status' : 'Nu există cereri încă'}
            </p>
            <p className="text-sm text-slate-400 max-w-xs">Cererile trimise prin formularul de pe site vor apărea aici automat.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {registrations.map(r => {
              const cfg = STATUS_CONFIG[r.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={r.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
                        style={{ background: `linear-gradient(135deg, #6366f1, #8b5cf6)`, color: '#fff' }}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{r.name}</p>
                        <p className="text-xs text-slate-400">{fmtDate(r.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-5 py-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <a href={`tel:${r.phone}`} className="hover:text-indigo-600 transition-colors font-medium">{r.phone}</a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <a href={`mailto:${r.email}`} className="hover:text-indigo-600 transition-colors font-medium truncate">{r.email}</a>
                    </div>
                    {r.course && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="font-medium">{COURSE_EMOJI[r.course] ?? '🎵'} {r.course}{r.age ? ` · ${r.age} ani` : ''}</span>
                      </div>
                    )}
                    {r.message && (
                      <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="italic line-clamp-2">{r.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={r.status}
                        onChange={e => updateStatus(r.id, e.target.value)}
                        className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <button onClick={() => setDeleteTarget(r)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge cererea" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Ștergi cererea de la <strong className="text-slate-900 dark:text-white">{deleteTarget?.name}</strong>? Aceasta nu poate fi recuperată.
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
