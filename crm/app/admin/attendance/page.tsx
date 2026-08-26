'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { ClipboardList, Search, Filter, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ATTENDANCE_STATUSES, AttendanceStatus, INSTRUMENTS } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Record_ {
  lesson_id: number; date: string; time: string; discipline: string | null;
  student_id: number; student_name: string | null;
  teacher_id: number; teacher_name: string | null;
  status: AttendanceStatus | null; notes: string | null;
}

const STATUS_DOT: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500', excused_absence: 'bg-amber-400', unexcused_absence: 'bg-red-500', late: 'bg-blue-400',
};

const PAGE_SIZE = 25;

export default function AttendanceRegisterPage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => { fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {}); }, []);

  const { data: teachersData } = useSWR('/api/teachers', fetcher);
  const { data: studentsData } = useSWR('/api/students', fetcher);

  const [q, setQ] = useState('');
  const [fStudent, setFStudent] = useState('');
  const [fTeacher, setFTeacher] = useState('');
  const [fDiscipline, setFDiscipline] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [page, setPage] = useState(0);
  const [sortDesc, setSortDesc] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  const params = new URLSearchParams();
  if (fStudent) params.set('student_id', fStudent);
  if (fTeacher) params.set('teacher_id', fTeacher);
  if (fDiscipline) params.set('discipline', fDiscipline);
  if (fStatus) params.set('status', fStatus);
  params.set('limit', String(PAGE_SIZE));
  params.set('offset', String(page * PAGE_SIZE));

  const { data, mutate, isLoading } = useSWR(`/api/attendance?${params.toString()}`, fetcher);
  let records: Record_[] = data?.records ?? [];
  const total: number = data?.total ?? 0;

  if (q) {
    const needle = q.toLowerCase();
    records = records.filter(r => (r.student_name ?? '').toLowerCase().includes(needle) || (r.teacher_name ?? '').toLowerCase().includes(needle));
  }
  records = [...records].sort((a, b) => sortDesc ? (a.date < b.date ? 1 : -1) : (a.date > b.date ? 1 : -1));

  const teachers = teachersData?.teachers ?? [];
  const students = studentsData?.students ?? [];

  const mark = async (lessonId: number, status: AttendanceStatus) => {
    setSaving(lessonId);
    try {
      await fetch('/api/attendance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lesson_id: lessonId, status }) });
      mutate();
    } finally {
      setSaving(null);
    }
  };

  const exportUrl = `/api/attendance/export?${params.toString()}`;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col flex-1">
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><ClipboardList className="w-7 h-7 text-white" /></div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Registru Frecvență</h1>
            <p className="text-teal-100 text-sm font-medium mt-0.5">{total} lecții{role === 'teacher' ? ' · elevii tăi' : ''}</p>
          </div>
          <a href={exportUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary"><Download className="w-4 h-4" /> Export CSV</Button>
          </a>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Caută elev sau profesor pe pagina curentă…"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" /><span className="text-xs text-slate-400 font-medium">Filtre</span>
          </div>
          <div className="w-40"><Select value={fStudent} onChange={e => { setFStudent(e.target.value); setPage(0); }} placeholder="Elev" options={students.map((s: { id: number; name: string }) => ({ value: s.id, label: s.name }))} /></div>
          {role === 'admin' && <div className="w-40"><Select value={fTeacher} onChange={e => { setFTeacher(e.target.value); setPage(0); }} placeholder="Profesor" options={teachers.map((t: { id: number; name: string }) => ({ value: t.id, label: t.name }))} /></div>}
          <div className="w-40"><Select value={fDiscipline} onChange={e => { setFDiscipline(e.target.value); setPage(0); }} placeholder="Disciplină" options={INSTRUMENTS.map(i => ({ value: i, label: i }))} /></div>
          <div className="w-44"><Select value={fStatus} onChange={e => { setFStatus(e.target.value); setPage(0); }} placeholder="Status" options={ATTENDANCE_STATUSES.map(s => ({ value: s.value, label: s.label }))} /></div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Elev</th>
                  <th className="px-4 py-3">Disciplină</th>
                  <th className="px-4 py-3">Profesor</th>
                  <th className="px-4 py-3">
                    <button onClick={() => setSortDesc(s => !s)} className="flex items-center gap-1 hover:text-slate-600">
                      Data lecției <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-center">Prezent</th>
                  <th className="px-3 py-3 text-center">Abs. mot.</th>
                  <th className="px-3 py-3 text-center">Abs. nemot.</th>
                  <th className="px-3 py-3 text-center">Întârz.</th>
                  <th className="px-4 py-3">Comentarii</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan={9} className="text-center py-10 text-slate-400">Se încarcă…</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-slate-400">Nicio înregistrare</td></tr>
                ) : records.map(r => (
                  <tr key={r.lesson_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{r.student_name}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.discipline ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.teacher_name}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.date} · {r.time?.slice(0, 5)}</td>
                    {(['present', 'excused_absence', 'unexcused_absence', 'late'] as AttendanceStatus[]).map(status => (
                      <td key={status} className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => mark(r.lesson_id, status)}
                          disabled={saving === r.lesson_id}
                          className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center transition-all ${r.status === status ? `${STATUS_DOT[status]} text-white` : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                          {r.status === status ? '✓' : ''}
                        </button>
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-slate-400 text-xs max-w-48 truncate">{r.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>Pagina {page + 1} din {totalPages} · {total} total</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => (p + 1 < totalPages ? p + 1 : p))} disabled={page + 1 >= totalPages} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
