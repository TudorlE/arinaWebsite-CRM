'use client';

import { useState, useEffect } from 'react';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { ShieldCheck } from 'lucide-react';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:    { label: 'Admin',    color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' },
  profesor: { label: 'Profesor', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  elev:     { label: 'Elev',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  teacher:  { label: 'Profesor', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' },
  student:  { label: 'Elev',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

type User = { id: number; name: string; email: string; role: string | null; status?: string; created_at: string };
type Me   = { id: number; name: string; email: string; role: string };

export default function RolesPage() {
  const { toasts, toast, remove } = useToast();
  const [me, setMe]           = useState<Me | null>(null);
  const [users, setUsers]     = useState<User[]>([]);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user ?? null));
  }, []);

  useEffect(() => {
    if (me?.role === 'admin') {
      fetch('/api/users').then(r => r.json()).then(d => setUsers(d.users ?? []));
    }
  }, [me]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdating(userId);
    try {
      const res  = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        toast(`Rol actualizat: ${ROLE_LABELS[newRole]?.label ?? newRole}`, 'success');
      } else {
        toast(data.error ?? 'Eroare', 'error');
      }
    } finally {
      setUpdating(null);
    }
  };

  if (me && me.role !== 'admin') {
    return (
      <div className="flex flex-col flex-1">
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-700 to-accent-700 px-8 py-6 shadow-lg">
          <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Roluri</h1>
              <p className="text-brand-200 text-sm font-medium mt-0.5">Gestionare conturi și permisiuni</p>
            </div>
          </div>
        </div>
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Acces restricționat — doar administratorii pot gestiona rolurile.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* ── Page Banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-700 to-accent-700 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Roluri</h1>
            <p className="text-brand-200 text-sm font-medium mt-0.5">{users.length} conturi gestionate</p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-[2fr_2fr_1fr_auto] gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span>Utilizator</span>
            <span>Email</span>
            <span>Rol actual</span>
            <span>Schimbă</span>
          </div>

          {/* Loading */}
          {!me && (
            <p className="p-6 text-sm text-slate-400">Se încarcă...</p>
          )}

          {/* Rows */}
          {users.length > 0 && users.map(u => (
            <div key={u.id} className="grid grid-cols-[2fr_2fr_1fr_auto] gap-4 items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              {/* Avatar + name */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                  {u.id === me?.id && (
                    <p className="text-xs text-slate-400">(contul tău)</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{u.email}</p>

              {/* Current role badge */}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${u.role ? (ROLE_LABELS[u.role]?.color ?? 'bg-slate-100 text-slate-600') : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {u.role ? (ROLE_LABELS[u.role]?.label ?? u.role) : 'Fără rol'}
              </span>

              {/* Role select */}
              <select
                value={u.role ?? ''}
                disabled={updating === u.id || u.id === me?.id || u.role === 'admin'}
                onChange={e => handleRoleChange(u.id, e.target.value)}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {!u.role && <option value="" disabled>Fără rol</option>}
                {u.role === 'admin' && <option value="admin">Admin</option>}
                <option value="teacher">Profesor</option>
                <option value="student">Elev</option>
              </select>
            </div>
          ))}

          {/* Empty */}
          {me?.role === 'admin' && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ShieldCheck className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Niciun utilizator găsit</p>
            </div>
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
