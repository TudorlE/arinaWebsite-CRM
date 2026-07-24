'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Pencil, Trash2, Eye, GraduationCap, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StudentForm from '@/components/students/StudentForm';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import Select from '@/components/ui/Select';
import { Student, INSTRUMENTS } from '@/lib/types';
import Modal from '@/components/ui/Modal';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const INSTRUMENT_COLOR: Record<string, string> = {
  'Piano': 'indigo', 'Chitară': 'purple', 'Tobe': 'yellow',
  'Canto': 'blue', 'Teoria muzicii': 'green', 'Solfegiu': 'red',
};

export default function StudentsPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);
  const isReadOnly = role === 'teacher';

  const [search, setSearch]       = useState('');
  const [instrument, setInstrument] = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const { toasts, toast, remove } = useToast();

  // Build query string
  const params = new URLSearchParams();
  if (search)     params.set('search', search);
  if (instrument) params.set('instrument', instrument);

  const { data, mutate } = useSWR(`/api/students?${params}`, fetcher, { keepPreviousData: true });
  const students: Student[] = data?.students ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Elev șters', 'success');
        mutate();
      } else {
        toast('Eroare la ștergere', 'error');
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {/* ── Page Banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Elevi</h1>
            <p className="text-orange-100 text-sm font-medium mt-0.5">{students.length} elevi înscriși</p>
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
              placeholder="Caută elevi…"
              className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800
                text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
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
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Instrument</span>
            </div>
            <Select
              value={instrument}
              onChange={e => setInstrument(e.target.value)}
              placeholder="Toate"
              options={INSTRUMENTS.map(i => ({ value: i, label: i }))}
              className="min-w-40 text-sm"
            />
            {instrument && (
              <button
                onClick={() => setInstrument('')}
                className="flex items-center gap-1 text-xs font-semibold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 px-2.5 py-1 rounded-full hover:bg-orange-100 transition-colors"
              >
                <X className="w-3 h-3" /> Resetează
              </button>
            )}
          </div>
          <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {students.length} elevi
          </span>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

          {/* Add student card — hidden for read-only roles */}
          {!isReadOnly && <button
            onClick={() => { setEditStudent(null); setShowForm(true); }}
            className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] min-h-[156px] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/60 group-hover:scale-110 transition-all duration-200">
              <Plus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Adaugă elev</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Înregistrează un elev nou</p>
            </div>
          </button>}

          {/* Student cards */}
          {students.map(student => (
            <div key={student.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">{student.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Vârstă {student.age}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(student.instruments ?? []).map((instr: string) => (
                  <Badge key={instr} variant={(INSTRUMENT_COLOR[instr] ?? 'gray') as Parameters<typeof Badge>[0]['variant']}>
                    {instr}
                  </Badge>
                ))}
                {student.teacher_name && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-full">{student.teacher_name}</span>
                )}
              </div>

              <div className="flex items-center justify-end mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/students/${student.id}`)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  {!isReadOnly && <>
                    <Button variant="ghost" size="sm" onClick={() => { setEditStudent(student); setShowForm(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(student)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Student form modal */}
      <StudentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => mutate()}
        student={editStudent}
        showToast={toast}
      />

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge elev" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Ești sigur că vrei să ștergi <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.name}</strong>?
          Aceasta va șterge și lecțiile, plățile și notele sale.
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
