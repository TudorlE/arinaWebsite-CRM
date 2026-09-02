'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Audition, INSTRUMENTS } from '@/lib/types';
import { DEFAULT_TIME_SLOTS } from '@/lib/timeSlots';
import { User, Calendar, FileText } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  audition?: Audition | null;
  defaultDate?: string;
  defaultTime?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const blank = {
  candidate_name: '', discipline: '', date: '', time: DEFAULT_TIME_SLOTS[0],
  duration: '30', notes: '', result: '', status: 'scheduled',
};

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Programată' },
  { value: 'completed', label: 'Finalizată' },
  { value: 'cancelled', label: 'Anulată' },
  { value: 'no_show',   label: 'Neprezentare' },
];

export default function AuditionForm({ open, onClose, onSaved, audition, defaultDate, defaultTime, showToast }: Props) {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (audition) {
      setForm({
        candidate_name: audition.candidate_name ?? '',
        discipline: audition.discipline ?? '',
        date: audition.date,
        time: audition.time,
        duration: String(audition.duration),
        notes: audition.notes ?? '',
        result: audition.result ?? '',
        status: audition.status,
      });
    } else {
      setForm({
        ...blank,
        date: defaultDate ?? '',
        time: defaultTime ?? DEFAULT_TIME_SLOTS[0],
      });
    }
    setErrors({});
  }, [audition, open, defaultDate, defaultTime]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.candidate_name.trim()) newErrors.candidate_name = true;
    if (!form.date) newErrors.date = true;
    if (!form.time) newErrors.time = true;
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

  return (
    <Modal open={open} onClose={onClose} title={audition ? 'Editează audiție' : 'Audiție nouă'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <User className="w-4 h-4" />
            Candidat
          </div>
          <Input label="Nume" value={form.candidate_name} onChange={set('candidate_name')} shake={errors.candidate_name} placeholder="Numele candidatului" />
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
          <div className={audition ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-3 gap-3'}>
            {!audition && <Input label="Dată" value={form.date} onChange={set('date')} shake={errors.date} type="date" />}
            <Select label="Oră" value={form.time} onChange={set('time')} shake={errors.time}
              placeholder="Selectează ora" options={DEFAULT_TIME_SLOTS.map(t => ({ value: t, label: t }))} />
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
