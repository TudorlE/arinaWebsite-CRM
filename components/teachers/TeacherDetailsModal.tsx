'use client';

import useSWR from 'swr';
import Modal from '@/components/ui/Modal';
import { Teacher } from '@/lib/types';
import { formatBirthDate } from '@/lib/dateUtils';
import { Phone, Mail, Wallet, Users, Calendar, Repeat } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  open: boolean;
  onClose: () => void;
  teacher: Teacher | null;
}

const STAT_TILES: { key: string; label: string; color: string }[] = [
  { key: 'total',             label: 'Total lecții',       color: 'text-slate-700 dark:text-slate-200' },
  { key: 'scheduled',         label: 'Programate',         color: 'text-brand-600 dark:text-brand-400' },
  { key: 'completed',         label: 'Finalizate',         color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'cancelled',         label: 'Anulate',             color: 'text-slate-500 dark:text-slate-400' },
  { key: 'recovered',         label: 'Recuperate',         color: 'text-accent-600 dark:text-accent-400' },
  { key: 'present',           label: 'Prezențe',           color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'excused_absence',   label: 'Absențe motivate',   color: 'text-amber-600 dark:text-amber-400' },
  { key: 'unexcused_absence', label: 'Absențe nemotivate', color: 'text-red-600 dark:text-red-400' },
];

export default function TeacherDetailsModal({ open, onClose, teacher }: Props) {
  const { data, isLoading } = useSWR(open && teacher ? `/api/teachers/${teacher.id}/summary` : null, fetcher);

  if (!teacher) return null;
  const stats = data?.stats;
  const students: string[] = data?.stats?.students ?? [];
  const totalPaid: number = data?.totalPaid ?? 0;
  const replacements: { date: string; time: string; student: string | null; discipline: string | null; titular: string | null }[] = data?.replacements ?? [];

  return (
    <Modal open={open} onClose={onClose} title="Detalii profesor" size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
              {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate">{teacher.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatBirthDate(teacher.birth_date)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Phone className="w-4 h-4 flex-shrink-0" />{teacher.phone}</div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Mail className="w-4 h-4 flex-shrink-0" /><span className="truncate">{teacher.email}</span></div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Calendar className="w-4 h-4 flex-shrink-0" />Înscris: {new Date(teacher.created_at).toLocaleDateString('ro-RO')}</div>
          {teacher.bio && <p className="text-slate-500 dark:text-slate-400 sm:col-span-2 italic">{teacher.bio}</p>}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Activitate (din totdeauna)</p>
            <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" /> {totalPaid.toLocaleString()} MDL aduși
            </p>
          </div>
          {isLoading ? (
            <p className="text-sm text-slate-400 text-center py-6">Se încarcă…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {STAT_TILES.map(t => (
                <div key={t.key} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 text-center">
                  <p className={`text-2xl font-extrabold ${t.color}`}>{stats?.[t.key] ?? 0}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.label}</p>
                </div>
              ))}
            </div>
          )}
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <Users className="w-3.5 h-3.5" /> Elevi cu care a lucrat ({students.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {students.map(name => (
              <span key={name} className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">{name}</span>
            ))}
            {students.length === 0 && <span className="text-xs text-slate-400">Niciun elev încă</span>}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-500 mb-2">
            <Repeat className="w-3.5 h-3.5" /> Înlocuiri făcute ({replacements.length})
          </p>
          {replacements.length === 0 ? (
            <span className="text-xs text-slate-400">Nicio înlocuire înregistrată</span>
          ) : (
            <ul className="space-y-1 max-h-44 overflow-auto text-sm">
              {replacements.map((r, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg bg-violet-50/60 dark:bg-violet-900/15 px-2.5 py-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{new Date(r.date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}</span>
                  <span className="text-slate-500 dark:text-slate-400">{r.time?.slice(0, 5)}</span>
                  <span className="text-slate-700 dark:text-slate-200">{r.student ?? '—'}</span>
                  {r.discipline && <span className="text-xs text-slate-400">· {r.discipline}</span>}
                  {r.titular && <span className="text-xs text-violet-600 dark:text-violet-400">· în locul lui {r.titular}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
