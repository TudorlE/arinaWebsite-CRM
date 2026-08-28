'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Lesson, INSTRUMENTS } from '@/lib/types';
import { DEFAULT_TIME_SLOTS } from '@/lib/timeSlots';
import useSWR from 'swr';
import { GraduationCap, Calendar, FileText, DoorOpen } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  lesson?: Lesson | null;
  defaultStudentId?: number;
  defaultDate?: string;
  defaultTime?: string;
  defaultCabinetId?: number | null;
  defaultTeacherId?: number | null;
  defaultDiscipline?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const blank = {
  student_id: '', teacher_id: '', discipline: '', date: '',
  time: DEFAULT_TIME_SLOTS[0], duration: '45', notes: '', cabinet_id: '',
};

export default function LessonForm({ open, onClose, onSaved, lesson, defaultStudentId, defaultDate, defaultTime, defaultCabinetId, defaultTeacherId, defaultDiscipline, showToast }: Props) {
  const [form, setForm]     = useState(blank);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const { data: studentsData } = useSWR('/api/students', fetcher);
  const { data: teachersData } = useSWR('/api/teachers', fetcher);
  const { data: cabinetsData } = useSWR('/api/cabinets', fetcher);

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
      });
    } else {
      setForm({
        ...blank,
        student_id: defaultStudentId ? String(defaultStudentId) : '',
        date: defaultDate ?? '',
        time: defaultTime ?? DEFAULT_TIME_SLOTS[0],
        cabinet_id: defaultCabinetId ? String(defaultCabinetId) : '',
        teacher_id: defaultTeacherId ? String(defaultTeacherId) : '',
        discipline: defaultDiscipline ?? '',
      });
    }
    setErrors({});
  }, [lesson, open, defaultStudentId, defaultDate, defaultTime, defaultCabinetId, defaultTeacherId, defaultDiscipline]);

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

        {/* Participanți */}
        <div className="animate-slide-up" style={{ animationDelay: '40ms' }}>
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

        {/* Programare */}
        <div className="animate-slide-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <Calendar className="w-4 h-4" />
            Programare
          </div>
          <div className={lesson ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-3'}>
            {!lesson && <Input label="Dată" value={form.date} onChange={set('date')} shake={errors.date} type="date" />}
            <Select
              label="Oră"
              value={form.time}
              onChange={set('time')}
              shake={errors.time}
              placeholder="Selectează ora"
              options={DEFAULT_TIME_SLOTS.map(t => ({ value: t, label: t }))}
            />
          </div>
        </div>

        {/* Cabinet */}
        <div className="animate-slide-up" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <DoorOpen className="w-4 h-4" />
            Cabinet
          </div>
          {cabinets.length > 0 ? (
            <Select
              label=""
              value={form.cabinet_id}
              onChange={set('cabinet_id')}
              placeholder="Fără cabinet (opțional)"
              options={cabinets.map((c: { id: number; name: string }) => ({ value: c.id, label: c.name }))}
            />
          ) : (
            <a
              href="/cabinets"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20 text-sm text-brand-500 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
            >
              <DoorOpen className="w-4 h-4 flex-shrink-0" />
              <span>Nu există cabinete — <strong>configurează-le aici</strong></span>
            </a>
          )}
        </div>

        {/* Note */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <FileText className="w-4 h-4" />
            Note
          </div>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            placeholder="Adaugă observații despre lecție…"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800
              text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-all duration-150"
          />
        </div>

        {/* Acțiuni */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-slide-up" style={{ animationDelay: '280ms' }}>
          <Button type="button" variant="secondary" onClick={onClose}>Anulează</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Se salvează…' : lesson ? 'Salvează' : 'Adaugă lecție'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

