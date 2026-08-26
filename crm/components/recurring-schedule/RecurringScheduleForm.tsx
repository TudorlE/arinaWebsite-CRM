'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { RecurringSchedule, INSTRUMENTS, DAYS_OF_WEEK } from '@/lib/types';
import { GraduationCap, Calendar, DoorOpen, FileText } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  schedule?: RecurringSchedule | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const blank = {
  student_id: '', teacher_id: '', discipline: '', cabinet_id: '',
  day_of_week: '1', start_time: '16:00', end_time: '16:45', notes: '',
};

export default function RecurringScheduleForm({ open, onClose, onSaved, schedule, showToast }: Props) {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const { data: studentsData } = useSWR('/api/students', fetcher);
  const { data: teachersData } = useSWR('/api/teachers', fetcher);
  const { data: cabinetsData } = useSWR('/api/cabinets', fetcher);

  useEffect(() => {
    if (schedule) {
      setForm({
        student_id: String(schedule.student_id),
        teacher_id: String(schedule.teacher_id),
        discipline: schedule.discipline ?? '',
        cabinet_id: schedule.cabinet_id ? String(schedule.cabinet_id) : '',
        day_of_week: String(schedule.day_of_week),
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        notes: schedule.notes ?? '',
      });
    } else {
      setForm(blank);
    }
    setErrors({});
  }, [schedule, open]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.student_id) newErrors.student_id = true;
    if (!form.teacher_id) newErrors.teacher_id = true;
    if (!form.start_time)  newErrors.start_time = true;
    if (!form.end_time)    newErrors.end_time = true;
    if (form.start_time && form.end_time && form.end_time <= form.start_time) newErrors.end_time = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const url    = schedule ? `/api/recurring-schedules/${schedule.id}` : '/api/recurring-schedules';
      const method = schedule ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          student_id: Number(form.student_id),
          teacher_id: Number(form.teacher_id),
          cabinet_id: form.cabinet_id ? Number(form.cabinet_id) : null,
          day_of_week: Number(form.day_of_week),
          discipline: form.discipline || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? 'Eroare la salvare', 'error');
      } else {
        showToast(schedule ? 'Orar fix actualizat!' : 'Orar fix adăugat!', 'success');
        onSaved();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const students = studentsData?.students ?? [];
  const teachers = teachersData?.teachers ?? [];
  const cabinets = cabinetsData?.cabinets ?? [];

  return (
    <Modal open={open} onClose={onClose} title={schedule ? 'Editează orarul fix' : 'Orar fix nou'}>
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <GraduationCap className="w-4 h-4" />
            Participanți
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Elev"
              value={form.student_id}
              onChange={set('student_id')}
              shake={errors.student_id}
              placeholder="Selectează elev"
              options={students.map((s: { id: number; name: string }) => ({ value: s.id, label: s.name }))}
            />
            <Select
              label="Profesor"
              value={form.teacher_id}
              onChange={set('teacher_id')}
              shake={errors.teacher_id}
              placeholder="Selectează profesor"
              options={teachers.map((t: { id: number; name: string }) => ({ value: t.id, label: t.name }))}
            />
          </div>
          <div className="mt-3">
            <Select
              label="Disciplină"
              value={form.discipline}
              onChange={set('discipline')}
              placeholder="Fără disciplină specificată"
              options={INSTRUMENTS.map(i => ({ value: i, label: i }))}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <Calendar className="w-4 h-4" />
            Recurență săptămânală
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Zi"
              value={form.day_of_week}
              onChange={set('day_of_week')}
              options={DAYS_OF_WEEK.map((d, i) => ({ value: i, label: d }))}
            />
            <Input label="Ora start" value={form.start_time} onChange={set('start_time')} shake={errors.start_time} type="time" />
            <Input label="Ora sfârșit" value={form.end_time} onChange={set('end_time')} shake={errors.end_time} type="time" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <DoorOpen className="w-4 h-4" />
            Cabinet
          </div>
          <Select
            value={form.cabinet_id}
            onChange={set('cabinet_id')}
            placeholder="Fără cabinet (opțional)"
            options={cabinets.map((c: { id: number; name: string }) => ({ value: c.id, label: c.name }))}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <FileText className="w-4 h-4" />
            Note
          </div>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            placeholder="Note interne despre acest orar fix…"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800
              text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-all duration-150"
          />
        </div>

        {schedule && (
          <p className="text-xs text-slate-400 italic">
            Editarea aici actualizează șablonul și toate lecțiile viitoare negenerate manual (nemodificate individual).
          </p>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>Anulează</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Se salvează…' : schedule ? 'Salvează' : 'Adaugă orar fix'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
