'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Audition, INSTRUMENTS } from '@/lib/types';
import { GraduationCap, Calendar, FileText } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  audition?: Audition | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const blank = {
  student_id: '', teacher_id: '', discipline: '', date: '', time: '10:00',
  duration: '30', notes: '', result: '', status: 'scheduled',
};

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Programată' },
  { value: 'completed', label: 'Finalizată' },
  { value: 'cancelled', label: 'Anulată' },
  { value: 'no_show',   label: 'Neprezentare' },
];

export default function AuditionForm({ open, onClose, onSaved, audition, showToast }: Props) {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const { data: studentsData } = useSWR('/api/students', fetcher);
  const { data: teachersData } = useSWR('/api/teachers', fetcher);

  useEffect(() => {
    if (audition) {
      setForm({
        student_id: String(audition.student_id),
        teacher_id: audition.teacher_id ? String(audition.teacher_id) : '',
        discipline: audition.discipline ?? '',
        date: audition.date,
        time: audition.time,
        duration: String(audition.duration),
        notes: audition.notes ?? '',
        result: audition.result ?? '',
        status: audition.status,
      });
    } else {
      setForm(blank);
    }
    setErrors({});
  }, [audition, open]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.student_id) newErrors.student_id = true;
    if (!form.date)       newErrors.date = true;
    if (!form.time)       newErrors.time = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const url    = audition ? `/api/auditions/${audition.id}` : '/api/auditions';
      const method = audition ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          student_id: Number(form.student_id),
          teacher_id: form.teacher_id ? Number(form.teacher_id) : null,
          duration: Number(form.duration),
          discipline: form.discipline || null,
          result: form.result || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? 'Eroare la salvare', 'error');
      } else {
        showToast(audition ? 'Audiție actualizată!' : 'Audiție programată!', 'success');
        onSaved();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const students = studentsData?.students ?? [];
  const teachers = teachersData?.teachers ?? [];

  return (
    <Modal open={open} onClose={onClose} title={audition ? 'Editează audiție' : 'Audiție nouă'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <GraduationCap className="w-4 h-4" />
            Participanți
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Elev" value={form.student_id} onChange={set('student_id')} shake={errors.student_id}
              placeholder="Selectează elev" options={students.map((s: { id: number; name: string }) => ({ value: s.id, label: s.name }))} />
            <Select label="Profesor" value={form.teacher_id} onChange={set('teacher_id')}
              placeholder="Fără profesor asignat" options={teachers.map((t: { id: number; name: string }) => ({ value: t.id, label: t.name }))} />
          </div>
          <div className="mt-3">
            <Select label="Disciplină" value={form.discipline} onChange={set('discipline')}
              placeholder="Fără disciplină specificată" options={INSTRUMENTS.map(i => ({ value: i, label: i }))} />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <Calendar className="w-4 h-4" />
            Programare
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Dată" value={form.date} onChange={set('date')} shake={errors.date} type="date" />
            <Input label="Oră"  value={form.time} onChange={set('time')} shake={errors.time} type="time" />
            <Input label="Durată (min)" value={form.duration} onChange={set('duration')} type="number" min={5} step={5} />
          </div>
          <div className="mt-3">
            <Select label="Status" value={form.status} onChange={set('status')} options={STATUS_OPTIONS} />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <FileText className="w-4 h-4" />
            Note & rezultat
          </div>
          <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Note despre audiție…"
            className="w-full mb-3 px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none" />
          <textarea value={form.result} onChange={set('result')} rows={2} placeholder="Rezultat (ex. notă, calificativ, decizie)…"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none" />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>Anulează</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Se salvează…' : audition ? 'Salvează' : 'Programează audiția'}</Button>
        </div>
      </form>
    </Modal>
  );
}
