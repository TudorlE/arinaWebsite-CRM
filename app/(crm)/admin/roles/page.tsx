'use client';

import { useState, useEffect, useRef } from 'react';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { ShieldCheck, UserCheck, UserX, Trash2, AlertTriangle } from 'lucide-react';
import PageBanner from '@/components/ui/PageBanner';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:         { label: 'Fondator (acces total)', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' },
  administrator: { label: 'Administrator (acces limitat)', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  profesor: { label: 'Profesor', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  elev:     { label: 'Elev',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  teacher:  { label: 'Profesor', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  student:  { label: 'Elev',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

// Polling interval for the account list — new registrations should show up here
// without the admin needing to hit refresh/reopen the tab.
const POLL_MS = 6000;

type User = { id: number; name: string; email: string; role: string | null; status: 'pending' | 'approved' | 'rejected'; created_at: string; teacher_id?: number | null; student_id?: number | null };
type Me   = { id: number; name: string; email: string; role: string };
type Fisa = { id: number; name: string };

export default function RolesPage() {
  const { toasts, toast, remove } = useToast();
  const [me, setMe]           = useState<Me | null>(null);
  const [users, setUsers]     = useState<User[]>([]);
  const [teachers, setTeachers] = useState<Fisa[]>([]);
  const [students, setStudents] = useState<Fisa[]>([]);
  const [updating, setUpdating] = useState<number | null>(null);

  // Pending-account approval (same atomic role+status+fișă action as Aprobări —
  // never a bare role change, or the account gets stuck "pending" forever).
  const [approveTarget, setApproveTarget] = useState<User | null>(null);
  const [approveRole, setApproveRole] = useState<'teacher' | 'student'>('teacher');
  const [approveFisaId, setApproveFisaId] = useState('');
  const [rejectTarget, setRejectTarget] = useState<User | null>(null);

  // Delete: account-only, or account + the linked fișă (lessons/attendance/payments included).
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refreshUsers = () => fetch('/api/users').then(r => r.json()).then(d => setUsers(d.users ?? [])).catch(() => {});

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user ?? null));
    fetch('/api/teachers').then(r => r.json()).then(d => setTeachers(d.teachers ?? []));
    fetch('/api/students').then(r => r.json()).then(d => setStudents(d.students ?? []));
  }, []);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (me?.role !== 'admin') return;
    refreshUsers();
    pollRef.current = setInterval(refreshUsers, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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

  const handleApprove = async () => {
    if (!approveTarget) return;
    setUpdating(approveTarget.id);
    try {
      const res = await fetch(`/api/users/${approveTarget.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: approveRole,
          teacher_id: approveRole === 'teacher' && approveFisaId ? Number(approveFisaId) : undefined,
          student_id: approveRole === 'student' && approveFisaId ? Number(approveFisaId) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`Cont aprobat: ${approveTarget.name}`, 'success');
        setApproveTarget(null);
        refreshUsers();
      } else {
        toast(data.error ?? 'Eroare la aprobare', 'error');
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setUpdating(rejectTarget.id);
    try {
      const res = await fetch(`/api/users/${rejectTarget.id}/reject`, { method: 'POST' });
      if (res.ok) {
        toast(`Cont respins: ${rejectTarget.name}`, 'success');
        setRejectTarget(null);
        refreshUsers();
      } else {
        const data = await res.json();
        toast(data.error ?? 'Eroare la respingere', 'error');
      }
    } finally {
      setUpdating(null);
    }
  };

  /** `withFisa`: also deletes the linked teacher/student record (lessons, attendance,
      payments all cascade away with it) — the account-only delete leaves that intact. */
  const handleDelete = async (withFisa: boolean) => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (withFisa && deleteTarget.role === 'teacher' && deleteTarget.teacher_id) {
        await fetch(`/api/teachers/${deleteTarget.teacher_id}`, { method: 'DELETE' });
      } else if (withFisa && deleteTarget.role === 'student' && deleteTarget.student_id) {
        await fetch(`/api/students/${deleteTarget.student_id}`, { method: 'DELETE' });
      }
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast(`Cont șters: ${deleteTarget.name}${withFisa ? ' (împreună cu fișa)' : ''}`, 'success');
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        toast(data.error ?? 'Eroare la ștergere', 'error');
      }
    } finally {
      setDeleting(false);
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

  const fisaName = deleteTarget?.role === 'teacher'
    ? teachers.find(t => t.id === deleteTarget.teacher_id)?.name
    : deleteTarget?.role === 'student'
      ? students.find(s => s.id === deleteTarget.student_id)?.name
      : undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageBanner icon={ShieldCheck} title="Roluri" subtitle={`${users.length} conturi gestionate`} accent="#5934DC" />

      <main className="flex-1 min-h-0 p-6 overflow-y-auto space-y-4">
        <div className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-900/15 p-4 text-sm text-violet-800 dark:text-violet-300">
          <strong>Administrator (acces limitat)</strong> — vede doar Program General, Audiții, Registru Frecvență,
          Profesori General, Profesori Frecvență, Elevi General și Elevi Frecvență. Restul secțiunilor
          (Dashboard, Program Privat, Plăți, Roluri, Setări) rămân vizibile doar pentru Fondator.
          <br />
          Un cont nou, în așteptare, se vede mai jos cu eticheta <strong>„În așteptare"</strong> — se aprobă direct de aici
          (rolul, statusul și fișa se atribuie într-un singur pas, ca să nu rămână blocat).
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

          {/* Table header — desktop only; mobile rows stack as cards instead,
              where column headers wouldn't mean anything. */}
          <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span>Utilizator</span>
            <span>Email</span>
            <span>Rol actual</span>
            <span>Acțiuni</span>
          </div>

          {/* Loading */}
          {!me && (
            <p className="p-6 text-sm text-slate-400">Se încarcă...</p>
          )}

          {/* Rows — stacked on mobile (a fixed 4-column grid has no room for a
              long role label like "Administrator (acces limitat)" on a phone,
              it was overlapping other text), a single grid row from sm: up. */}
          {users.length > 0 && users.map(u => {
            const isPending = u.status === 'pending';
            const isRejected = u.status === 'rejected';
            return (
              <div key={u.id} className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] sm:gap-4 sm:items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                      {isPending && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex-shrink-0">
                          În așteptare
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 flex-shrink-0">
                          Respins
                        </span>
                      )}
                    </div>
                    {u.id === me?.id && (
                      <p className="text-xs text-slate-400">(contul tău)</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{u.email}</p>

                {isPending ? (
                  <div className="sm:col-start-3 sm:col-span-2 flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setRejectTarget(u)} className="!bg-red-50 !text-red-600 hover:!bg-red-100 dark:!bg-red-900/30 dark:!text-red-400">
                      <UserX className="w-3.5 h-3.5" /> Respinge
                    </Button>
                    <Button size="sm" onClick={() => { setApproveTarget(u); setApproveRole('teacher'); setApproveFisaId(''); }}>
                      <UserCheck className="w-3.5 h-3.5" /> Aprobă
                    </Button>
                    <Button icon size="sm" variant="ghost" onClick={() => setDeleteTarget(u)} title="Șterge contul">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 sm:contents">
                      {/* Current role badge */}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${u.role ? (ROLE_LABELS[u.role]?.color ?? 'bg-slate-100 text-slate-600') : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {u.role ? (ROLE_LABELS[u.role]?.label ?? u.role) : 'Fără rol'}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Role select */}
                        <select
                          value={u.role ?? ''}
                          disabled={updating === u.id || u.id === me?.id || u.role === 'admin' || isRejected}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          {!u.role && <option value="" disabled>Fără rol</option>}
                          {u.role === 'admin' && <option value="admin">Fondator</option>}
                          <option value="administrator">Administrator (acces limitat)</option>
                          <option value="teacher">Profesor</option>
                          <option value="student">Elev</option>
                        </select>
                        {u.id !== me?.id && u.role !== 'admin' && (
                          <Button icon size="sm" variant="ghost" onClick={() => setDeleteTarget(u)} title="Șterge contul">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        )}
                      </div>
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
                  </>
                )}
              </div>
            );
          })}

          {/* Empty */}
          {me?.role === 'admin' && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ShieldCheck className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Niciun utilizator găsit</p>
            </div>
          )}
        </div>
      </main>

      {/* Approve modal — same atomic action as Aprobări (role + status + fișă together) */}
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
                  onClick={() => { setApproveRole('teacher'); setApproveFisaId(''); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${approveRole === 'teacher' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                >
                  <p className={`text-sm font-semibold ${approveRole === 'teacher' ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300'}`}>Profesor</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setApproveRole('student'); setApproveFisaId(''); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${approveRole === 'student' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                >
                  <p className={`text-sm font-semibold ${approveRole === 'student' ? 'text-orange-700 dark:text-orange-300' : 'text-slate-700 dark:text-slate-300'}`}>Elev</p>
                </button>
              </div>
            </div>

            <Select
              label={`Asociază cu fișa de ${approveRole === 'teacher' ? 'profesor' : 'elev'}`}
              value={approveFisaId}
              onChange={e => setApproveFisaId(e.target.value)}
              placeholder="Fără asociere (poate fi setată mai târziu)"
              options={(approveRole === 'teacher' ? teachers : students).map(f => ({ value: f.id, label: f.name }))}
            />

            <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setApproveTarget(null)} disabled={updating === approveTarget.id}>Anulează</Button>
              <Button onClick={handleApprove} disabled={updating === approveTarget.id}>
                <UserCheck className="w-3.5 h-3.5" /> {updating === approveTarget.id ? 'Se aprobă…' : 'Aprobă'}
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
            <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3">
              <Button variant="secondary" onClick={() => setRejectTarget(null)} disabled={updating === rejectTarget.id}>Anulează</Button>
              <Button variant="danger" onClick={handleReject} disabled={updating === rejectTarget.id}>
                <UserX className="w-3.5 h-3.5" /> {updating === rejectTarget.id ? 'Se respinge…' : 'Respinge'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete modal — account-only is always offered; account + fișă only when a fișă is actually linked. */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge cont" size="sm">
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-300">
                  Șterge contul lui <strong>{deleteTarget.name}</strong>?
                </p>
                <p className="text-xs text-red-600 dark:text-red-400/80 mt-1">
                  Nu se mai poate conecta. Nu poate fi anulat.
                </p>
              </div>
            </div>
            {fisaName && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-900/15 p-3 text-xs text-amber-800 dark:text-amber-300">
                Contul e legat de fișa de {deleteTarget.role === 'teacher' ? 'profesor' : 'elev'} <strong>{fisaName}</strong>.
                Poți șterge doar contul (fișa rămâne, cu toate lecțiile/plățile ei) sau șterge totul deodată —
                în acest caz lecțiile, prezențele și plățile legate de {deleteTarget.role === 'teacher' ? 'profesor' : 'elev'} se pierd definitiv.
              </div>
            )}
            <div className="grid grid-cols-1 sm:flex sm:justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Anulează</Button>
              <Button variant="danger" onClick={() => handleDelete(false)} disabled={deleting}>
                <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Se șterge…' : 'Șterge doar contul'}
              </Button>
              {fisaName && (
                <Button variant="danger" onClick={() => handleDelete(true)} disabled={deleting} className="!bg-red-700 hover:!bg-red-800">
                  <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Se șterge…' : `Șterge cont + fișă`}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
