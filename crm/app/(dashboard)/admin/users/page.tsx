'use client';

import { useEffect, useState, useMemo } from 'react';
import { ShieldCheck, UserCheck, UserX, Clock, Mail, Calendar, GraduationCap, Music2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ToastContainer, useToast } from '@/components/ui/Toast';

type User = {
  id: number;
  name: string;
  email: string;
  role: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};
type Me = { id: number; name: string; email: string; role: string };

const STATUS_LABEL: Record<string, { label: string; classes: string }> = {
  pending:  { label: 'În așteptare', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  approved: { label: 'Aprobat',      classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  rejected: { label: 'Respins',      classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', teacher: 'Profesor', student: 'Elev',
};

function fmtDate(s: string) {
  try { return new Date(s).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return s; }
}

export default function AdminUsersPage() {
  const { toasts, toast, remove } = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [approveTarget, setApproveTarget] = useState<User | null>(null);
  const [approveRole, setApproveRole] = useState<'teacher' | 'student'>('teacher');
  const [rejectTarget, setRejectTarget] = useState<User | null>(null);
  const [working, setWorking] = useState(false);

  const refresh = () => {
    fetch('/api/users').then(r => r.json()).then(d => { setUsers(d.users ?? []); setLoading(false); });
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user ?? null));
    refresh();
  }, []);

  const counts = useMemo(() => ({
    pending:  users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    rejected: users.filter(u => u.status === 'rejected').length,
    all:      users.length,
  }), [users]);

  const filtered = useMemo(() => {
    if (tab === 'all') return users;
    return users.filter(u => u.status === tab);
  }, [users, tab]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/users/${approveTarget.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: approveRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`Cont aprobat: ${approveTarget.name} (${ROLE_LABEL[approveRole]})`, 'success');
        setApproveTarget(null);
        refresh();
      } else {
        toast(data.error ?? 'Eroare la aprobare', 'error');
      }
    } finally {
      setWorking(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/users/${rejectTarget.id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast(`Cont respins: ${rejectTarget.name}`, 'success');
        setRejectTarget(null);
        refresh();
      } else {
        toast(data.error ?? 'Eroare la respingere', 'error');
      }
    } finally {
      setWorking(false);
    }
  };

  if (me && me.role !== 'admin') {
    return (
      <div className="flex flex-col flex-1">
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 px-8 py-6 shadow-lg">
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Aprobări utilizatori</h1>
              <p className="text-indigo-200 text-sm font-medium mt-0.5">Acces restricționat</p>
            </div>
          </div>
        </div>
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Doar administratorii pot accesa această pagină.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Aprobări utilizatori</h1>
            <p className="text-indigo-200 text-sm font-medium mt-0.5">
              {counts.pending > 0 ? `${counts.pending} conturi în așteptare` : 'Niciun cont nou de procesat'}
            </p>
          </div>
          {counts.pending > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/30 border border-amber-300/50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">{counts.pending} de aprobat</span>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'pending',  label: 'În așteptare', count: counts.pending,  icon: Clock,         color: 'amber'  },
            { key: 'approved', label: 'Aprobate',     count: counts.approved, icon: CheckCircle2,  color: 'emerald' },
            { key: 'rejected', label: 'Respinse',     count: counts.rejected, icon: UserX,         color: 'red'    },
            { key: 'all',      label: 'Total',        count: counts.all,      icon: ShieldCheck,   color: 'indigo' },
          ].map(c => {
            const active = tab === c.key;
            const colorMap: Record<string, string> = {
              amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
              emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
              red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50',
              indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50',
            };
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                onClick={() => setTab(c.key as typeof tab)}
                className={`group text-left rounded-2xl border-2 p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${active ? `${colorMap[c.color]} shadow-md` : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-white/40 dark:bg-white/10' : colorMap[c.color]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {active && <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">activ</span>}
                </div>
                <p className={`text-2xl font-extrabold ${active ? '' : 'text-slate-900 dark:text-white'}`}>{c.count}</p>
                <p className={`text-xs font-medium mt-0.5 ${active ? 'opacity-80' : 'text-slate-500 dark:text-slate-400'}`}>{c.label}</p>
              </button>
            );
          })}
        </div>

        {/* User list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Se încarcă…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ShieldCheck className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">{tab === 'pending' ? 'Nicio cerere de aprobare' : 'Niciun utilizator'}</p>
              {tab === 'pending' && <p className="text-xs mt-1">Toate conturile au fost procesate.</p>}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(u => {
                const isPending = u.status === 'pending';
                return (
                  <div key={u.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${isPending ? 'hover:bg-amber-50/40 dark:hover:bg-amber-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                    {/* Avatar + identity */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                        u.status === 'approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        u.status === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' :
                        'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_LABEL[u.status]?.classes}`}>
                            {STATUS_LABEL[u.status]?.label}
                          </span>
                          {u.role && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                              {ROLE_LABEL[u.role] ?? u.role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </span>
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Calendar className="w-3 h-3" />
                            {fmtDate(u.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {isPending ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setRejectTarget(u)}
                          className="!bg-red-50 !text-red-600 hover:!bg-red-100 dark:!bg-red-900/30 dark:!text-red-400"
                        >
                          <UserX className="w-3.5 h-3.5" /> Respinge
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => { setApproveTarget(u); setApproveRole('teacher'); }}
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Aprobă
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {u.status === 'approved' ? '✓ procesat' : '✗ respins'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Approve modal */}
      <Modal open={!!approveTarget} onClose={() => setApproveTarget(null)} title="Aprobă utilizator" size="sm">
        {approveTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                {approveTarget.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{approveTarget.name}</p>
                <p className="text-xs text-slate-500 truncate">{approveTarget.email}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Atribuie rolul:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setApproveRole('teacher')}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${approveRole === 'teacher' ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                >
                  <Music2 className={`w-5 h-5 ${approveRole === 'teacher' ? 'text-violet-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${approveRole === 'teacher' ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'}`}>Profesor</p>
                    <p className="text-[10px] text-slate-400">Acces la lecții și plăți</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setApproveRole('student')}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${approveRole === 'student' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                >
                  <GraduationCap className={`w-5 h-5 ${approveRole === 'student' ? 'text-orange-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${approveRole === 'student' ? 'text-orange-700 dark:text-orange-300' : 'text-slate-700 dark:text-slate-300'}`}>Elev</p>
                    <p className="text-[10px] text-slate-400">Acces limitat (read-only)</p>
                  </div>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">Rolul „Admin" nu poate fi asignat din UI.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setApproveTarget(null)} disabled={working}>Anulează</Button>
              <Button onClick={handleApprove} disabled={working}>
                <UserCheck className="w-3.5 h-3.5" /> {working ? 'Se aprobă…' : 'Aprobă'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Respinge utilizator" size="sm">
        {rejectTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-300">Confirmă respingerea</p>
                <p className="text-xs text-red-600 dark:text-red-400/80 mt-1">
                  <strong>{rejectTarget.name}</strong> nu va putea să se conecteze la aplicație până nu este reaprobat.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setRejectTarget(null)} disabled={working}>Anulează</Button>
              <Button variant="danger" onClick={handleReject} disabled={working}>
                <X className="w-3.5 h-3.5" /> {working ? 'Se respinge…' : 'Respinge'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
