'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Plus, Pencil, Trash2, Mail, Phone, Music2, Search, X, Cake, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import TeacherDetailsModal from '@/components/teachers/TeacherDetailsModal';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Teacher, INSTRUMENTS } from '@/lib/types';
import { formatBirthDate } from '@/lib/dateUtils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const blank = { name: '', email: '', phone: '', bio: '', birth_date: '', instruments: [] as string[] };

export default function TeachersPage() {
  const { data, mutate } = useSWR('/api/teachers', fetcher);
  const teachers: Teacher[] = data?.teachers ?? [];
  const { toasts, toast, remove } = useToast();

  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);
  const isReadOnly = role === 'teacher';

  const [showForm, setShowForm]         = useState(false);
  const [editTeacher, setEditTeacher]   = useState<Teacher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Teacher | null>(null);
  const [form, setForm]     = useState(blank);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch]     = useState('');

  const openAdd = () => { setEditTeacher(null); setForm(blank); setErrors({}); setShowForm(true); };
  const openEdit = (t: Teacher) => {
    setEditTeacher(t);
    setForm({ name: t.name, email: t.email, phone: t.phone, bio: t.bio ?? '', birth_date: t.birth_date ?? '', instruments: t.instruments ?? [] });
    setErrors({});
    setShowForm(true);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const toggleInstrument = (instr: string) => {
    setForm(prev => ({
      ...prev,
      instruments: prev.instruments.includes(instr)
        ? prev.instruments.filter(i => i !== instr)
        : [...prev.instruments, instr],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim())  newErrors.name  = true;
    if (!form.email.trim()) newErrors.email = true;
    if (!form.phone.trim()) newErrors.phone = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setLoading(true);
    try {
      const url    = editTeacher ? `/api/teachers/${editTeacher.id}` : '/api/teachers';
      const method = editTeacher ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast(editTeacher ? 'Profesor actualizat!' : 'Profesor adăugat!', 'success');
        mutate();
        setShowForm(false);
      } else {
        const d = await res.json();
        toast(d.error ?? 'Eroare', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teachers/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast('Profesor șters', 'success'); mutate(); }
      else toast('Eroare la ștergere', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {/* ── Page Banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-accent-600 to-accent-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Music2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Profesori General</h1>
            <p className="text-brand-200 text-sm font-medium mt-0.5">{teachers.length} instructori înregistrați</p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Caută profesori…"
              className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800
                text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                transition-shadow duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {teachers.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase())).length} profesori
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Add teacher card — hidden for read-only roles */}
          {!isReadOnly && <button
            onClick={openAdd}
            className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] min-h-[180px] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center group-hover:bg-brand-200 dark:group-hover:bg-brand-800/60 group-hover:scale-110 transition-all duration-200">
              <Plus className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-brand-600 dark:text-brand-400">Adaugă profesor</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Înregistrează un profesor nou</p>
            </div>
          </button>}

          {/* Teacher cards */}
          {teachers
            .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()))
            .map(teacher => (
            <div key={teacher.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                      {teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{teacher.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Profesor</p>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <Button variant="ghost" size="sm" onClick={() => setDetailsTarget(teacher)} title="Detalii">
                    <Info className="w-3.5 h-3.5" />
                  </Button>
                  {!isReadOnly && <>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(teacher)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(teacher)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </>}
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate text-xs">{teacher.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs">{teacher.phone}</span>
                </div>
                {teacher.birth_date && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Cake className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs">{formatBirthDate(teacher.birth_date)}</span>
                  </div>
                )}
              </div>

              {teacher.instruments && teacher.instruments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {teacher.instruments.map(i => (
                    <span key={i} className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                      <Music2 className="w-2.5 h-2.5" />{i}
                    </span>
                  ))}
                </div>
              )}

              {teacher.bio && (
                <p className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 line-clamp-2">
                  {teacher.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>

      <TeacherDetailsModal open={!!detailsTarget} onClose={() => setDetailsTarget(null)} teacher={detailsTarget} />

      {/* Add/Edit modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editTeacher ? 'Editează profesor' : 'Adaugă profesor'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nume complet" value={form.name} onChange={set('name')} shake={errors.name} placeholder="Maria Ionescu" />
          <Input label="Email" value={form.email} onChange={set('email')} type="email" shake={errors.email} placeholder="profesor@arrymusic.com" />
          <Input label="Telefon" value={form.phone} onChange={set('phone')} shake={errors.phone} placeholder="+373 69 000 000" />
          <DatePicker label="Data nașterii" value={form.birth_date} onChange={v => setForm(prev => ({ ...prev, birth_date: v }))} />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Discipline predate</label>
            <div className="flex flex-wrap gap-2">
              {INSTRUMENTS.map(instr => {
                const selected = form.instruments.includes(instr);
                return (
                  <button
                    key={instr}
                    type="button"
                    onClick={() => toggleInstrument(instr)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 select-none
                      ${selected ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-brand-400'}`}
                  >
                    {instr}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
            <textarea
              value={form.bio}
              onChange={set('bio')}
              rows={3}
              placeholder="Bio scurt sau specialități…"
              className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800
                text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Anulează</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Se salvează…' : editTeacher ? 'Salvează' : 'Adaugă profesor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge profesor" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Șterge <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.name}</strong>?
          Elevii lor vor fi neatribuiți.
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
