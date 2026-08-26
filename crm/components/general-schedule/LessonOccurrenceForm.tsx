'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Lesson, INSTRUMENTS } from '@/lib/types';
import { GraduationCap, Calendar, DoorOpen, FileText, Repeat, CircleDot } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  lesson?: Lesson | null;
  defaultDate?: string;
  defaultTime?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const blank = {
  student_id: '', teacher_id: '', discipline: '', date: '',
  time: '09:00', duration: '45', notes: '', cabinet_id: '', status: 'scheduled',
};

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Programată' },
  { value: 'completed', label: 'Finalizată' },
  { value: 'cancelled', label: 'Anulată' },
  { value: 'recovered', label: 'Recuperată' },
];

const PROPAGATE_OPTIONS: { value: 'only' | 'future' | 'all'; label: string; hint: string }[] = [
  { value: 'only',   label: 'Doar această lecție',        hint: 'Modifică o singură apariție' },
  { value: 'future', label: 'Această lecție și viitoarele', hint: 'Toate lecțiile de la această dată încolo' },
  { value: 'all',    label: 'Toate lecțiile generate',      hint: 'Inclusiv cele deja trecute' },
];

export default function LessonOccurrenceForm({ open, onClose, onSaved, lesson, defaultDate, defaultTime, showToast }: Props) {
  const [form, setForm]         = useState(blank);
  const [propagate, setPropagate] = useState<'only' | 'future' | 'all'>('only');
  const [errors, setErrors]     = useState<Record<string, boolean>>({});
  const [loading, setLoading]   = useState(false);

  const { data: studentsData } = useSWR('/api/students', fetcher);
  const { data: teachersData } = useSWR('/api/teachers', fetcher);
  const { data: cabinetsData } = useSWR('/api/cabinets', fetcher);

  const isRecurring = !!lesson?.recurring_schedule_id;

  useEffect(() => {
    if (lesson) {
      setForm({
        student_id: String(lesson.student_id),
        teacher_id: String(lesson.teacher_id),
        discipline: lesson.discipline ?? '',
        date: lesson.date,
        time: lesson.time,
        duration: String(lesson.duration),
        notes: lesson.notes ?? '',
        cabinet_id: lesson.cabinet_id ? String(lesson.cabinet_id) : '',
        status: lesson.status,
      });
    } else {
      setForm({ ...blank, date: defaultDate ?? '', time: defaultTime ?? '09:00' });
    }
    setPropagate('only');
    setErrors({});
  }, [lesson, open, defaultDate, defaultTime]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.student_id) newErrors.student_id = true;
    if (!form.teacher_id) newErrors.teacher_id = true;
    if (!form.date)       newErrors.date = true;
    if (!form.time)       newErrors.time = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const url    = lesson ? `/api/lessons/${lesson.id}` : '/api/lessons';
      const method = lesson ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          student_id: Number(form.student_id),
          teacher_id: Number(form.teacher_id),
          duration: Number(form.duration),
          cabinet_id: form.cabinet_id ? Number(form.cabinet_id) : null,
          discipline: form.discipline || null,
          ...(isRecurring ? { propagate } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? 'Eroare la salvare', 'error');
      } else {
        showToast(lesson ? 'Lecție actualizată!' : 'Lecție adăugată!', 'success');
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
    <Modal open={open} onClose={onClose} title={lesson ? 'Editează lecție' : 'Adaugă lecție nouă'}>
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <GraduationCap className="w-4 h-4" />
            Participanți
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Elev" value={form.student_id} onChange={set('student_id')} shake={errors.student_id}
              placeholder="Selectează elev"
              options={students.map((s: { id: number; name: string }) => ({ value: s.id, label: s.name }))}
            />
            <Select
              label="Profesor" value={form.teacher_id} onChange={set('teacher_id')} shake={errors.teacher_id}
              placeholder="Selectează profesor"
              options={teachers.map((t: { id: number; name: string }) => ({ value: t.id, label: t.name }))}
            />
          </div>
          <div className="mt-3">
            <Select
              label="Disciplină" value={form.discipline} onChange={set('discipline')}
              placeholder="Fără disciplină specificată"
              options={INSTRUMENTS.map(i => ({ value: i, label: i }))}
            />
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
        </div>

        {lesson && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              <CircleDot className="w-4 h-4" />
              Status
            </div>
            <Select value={form.status} onChange={set('status')} options={STATUS_OPTIONS} />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <DoorOpen className="w-4 h-4" />
            Cabinet
          </div>
          <Select
            value={form.cabinet_id} onChange={set('cabinet_id')} placeholder="Fără cabinet (opțional)"
            options={cabinets.map((c: { id: number; name: string }) => ({ value: c.id, label: c.name }))}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <FileText className="w-4 h-4" />
            Note
          </div>
          <textarea
            value={form.notes} onChange={set('notes')} rows={2}
            placeholder="Adaugă observații despre lecție…"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800
              text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-all duration-150"
          />
        </div>

        {isRecurring && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              <Repeat className="w-4 h-4" />
              Aplică modificarea la
            </div>
            <div className="space-y-2">
              {PROPAGATE_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${propagate === opt.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                  <input type="radio" name="propagate" checked={propagate === opt.value} onChange={() => setPropagate(opt.value)} className="accent-brand-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{opt.label}</p>
                    <p className="text-xs text-slate-400">{opt.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>Anulează</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Se salvează…' : lesson ? 'Salvează' : 'Adaugă lecție'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
