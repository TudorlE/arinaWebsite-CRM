'use client';

import useSWR from 'swr';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Student, STUDENT_STATUSES } from '@/lib/types';
import { formatBirthDate } from '@/lib/dateUtils';
import { Phone, Mail, Music2, DoorOpen, Wallet, GraduationCap, StickyNote, Calendar } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  open: boolean;
  onClose: () => void;
  student: Student | null;
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

export default function StudentDetailsModal({ open, onClose, student }: Props) {
  const { data, isLoading } = useSWR(open && student ? `/api/students/${student.id}/summary` : null, fetcher);

  if (!student) return null;
  const stats = data?.stats;
  const totalPaid: number = data?.totalPaid ?? 0;
  const statusInfo = STUDENT_STATUSES.find(s => s.value === (student.status ?? 'active'));

  return (
    <Modal open={open} onClose={onClose} title="Detalii elev" size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
              {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate">{student.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatBirthDate(student.birth_date)}</p>
          </div>
          <Badge variant={student.status === 'inactive' ? 'gray' : student.status === 'paused' ? 'yellow' : 'green'}>
            {statusInfo?.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Phone className="w-4 h-4 flex-shrink-0" />{student.phone}</div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Mail className="w-4 h-4 flex-shrink-0" /><span className="truncate">{student.email}</span></div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><GraduationCap className="w-4 h-4 flex-shrink-0" />Profesor: {student.teacher_name ?? 'Neatribuit'}</div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><DoorOpen className="w-4 h-4 flex-shrink-0" />Cabinet: {student.cabinet_name ?? 'Neatribuit'}</div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Calendar className="w-4 h-4 flex-shrink-0" />Înscris: {new Date(student.created_at).toLocaleDateString('ro-RO')}</div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Wallet className="w-4 h-4 flex-shrink-0" />Abonament: {student.monthly_fee} MDL/lună</div>
          <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400 sm:col-span-2">
            <Music2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {(student.instruments ?? []).map(i => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">{i}</span>
              ))}
            </div>
          </div>
          {student.notes && (
            <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 sm:col-span-2 italic">
              <StickyNote className="w-4 h-4 flex-shrink-0 mt-0.5" />{student.notes}
            </div>
          )}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STAT_TILES.map(t => (
                <div key={t.key} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 text-center">
                  <p className={`text-2xl font-extrabold ${t.color}`}>{stats?.[t.key] ?? 0}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
