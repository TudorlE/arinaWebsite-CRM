'use client';

import { useState, useEffect } from 'react';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { ShieldCheck } from 'lucide-react';
import PageBanner from '@/components/ui/PageBanner';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:         { label: 'Fondator (acces total)', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' },
  administrator: { label: 'Administrator (acces limitat)', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  profesor: { label: 'Profesor', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  elev:     { label: 'Elev',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  teacher:  { label: 'Profesor', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  student:  { label: 'Elev',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

type User = { id: number; name: string; email: string; role: string | null; status?: string; created_at: string; teacher_id?: number | null; student_id?: number | null };
type Me   = { id: number; name: string; email: string; role: string };
type Fisa = { id: number; name: string };

export default function RolesPage() {
  const { toasts, toast, remove } = useToast();
  const [me, setMe]           = useState<Me | null>(null);
  const [users, setUsers]     = useState<User[]>([]);
  const [teachers, setTeachers] = useState<Fisa[]>([]);
  const [students, setStudents] = useState<Fisa[]>([]);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user ?? null));
    fetch('/api/teachers').then(r => r.json()).then(d => setTeachers(d.teachers ?? []));
    fetch('/api/students').then(r => r.json()).then(d => setStudents(d.students ?? []));
  }, []);

  useEffect(() => {
    // Only already-approved accounts — a pending one changed here would get a
    // role but never flip to 'approved' (that only happens via the proper
    // Aprobări flow, which also asks for the teacher_id/student_id link).
    // Showing it here made it look "done" while the account stayed stuck,
    // unable to log in at all.
    if (me?.role === 'admin') {
      fetch('/api/users?status=approved').then(r => r.json()).then(d => setUsers(d.users ?? []));
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

  /** Links (or relinks) a teacher/student account to its fișă — the only place
      this can be done once the account is already approved (Approvals only
      offers it while a request is still pending). */
  const handleLinkChange = async (user: User, value: string) => {
    setUpdating(user.id);
    try {
      const body = user.role === 'teacher'
        ? { role: user.role, teacher_id: value || null }
        : { role: user.role, student_id: value || null };
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id
          ? { ...u, teacher_id: data.user?.teacher_id ?? null, student_id: data.user?.student_id ?? null }
          : u));
        toast('Fișă actualizată', 'success');
      } else {
        toast(data.error ?? 'Eroare', 'error');
      }
    } finally {
      setUpdating(null);
    }
  };

  if (me && me.role !== 'admin') {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <PageBanner icon={ShieldCheck} title="Roluri" subtitle="Gestionare conturi și permisiuni" accent="#5934DC" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Acces restricționat — doar administratorii pot gestiona rolurile.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageBanner icon={ShieldCheck} title="Roluri" subtitle={`${users.length} conturi gestionate`} accent="#5934DC" />

      <main className="flex-1 min-h-0 p-6 overflow-y-auto space-y-4">
        <div className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-900/15 p-4 text-sm text-violet-800 dark:text-violet-300">
          <strong>Administrator (acces limitat)</strong> — vede doar Program General, Audiții, Registru Frecvență,
          Profesori General, Profesori Frecvență, Elevi General și Elevi Frecvență. Restul secțiunilor
          (Dashboard, Program Privat, Plăți, Roluri, Setări) rămân vizibile doar pentru Fondator.
          <br />
          Un cont nou, în așteptare, nu apare aici — se aprobă din <strong>Aprobări</strong>, unde i se atribuie rolul și, pentru profesor/elev, fișa corespunzătoare.
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

          {/* Table header — desktop only; mobile rows stack as cards instead,
              where column headers wouldn't mean anything. */}
          <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span>Utilizator</span>
            <span>Email</span>
            <span>Rol actual</span>
            <span>Schimbă</span>
          </div>

          {/* Loading */}
          {!me && (
            <p className="p-6 text-sm text-slate-400">Se încarcă...</p>
          )}

          {/* Rows — stacked on mobile (a fixed 4-column grid has no room for a
              long role label like "Administrator (acces limitat)" on a phone,
              it was overlapping other text), a single grid row from sm: up. */}
          {users.length > 0 && users.map(u => (
            <div key={u.id} className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] sm:gap-4 sm:items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
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

              <div className="flex items-center justify-between gap-3 sm:contents">
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
                  {u.role === 'admin' && <option value="admin">Fondator</option>}
                  <option value="administrator">Administrator (acces limitat)</option>
                  <option value="teacher">Profesor</option>
                  <option value="student">Elev</option>
                </select>
              </div>

              {/* Fișa legată — doar pentru profesor/elev; un cont fără fișă nu
                  poate vedea de fapt nimic din datele lui odată logat. */}
              {(u.role === 'teacher' || u.role === 'student') && (
                <div className="sm:col-start-3 sm:col-span-2 flex items-center gap-2">
                  {!u[u.role === 'teacher' ? 'teacher_id' : 'student_id'] && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex-shrink-0">
                      Fără fișă
                    </span>
                  )}
                  <select
                    value={(u.role === 'teacher' ? u.teacher_id : u.student_id) ?? ''}
                    disabled={updating === u.id}
                    onChange={e => handleLinkChange(u, e.target.value)}
                    className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1 min-w-0"
                  >
                    <option value="">Asociază cu fișa de {u.role === 'teacher' ? 'profesor' : 'elev'}…</option>
                    {(u.role === 'teacher' ? teachers : students).map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}
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
