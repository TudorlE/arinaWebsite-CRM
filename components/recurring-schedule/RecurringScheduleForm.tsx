'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { RecurringSchedule, StudentSubscription, INSTRUMENTS, DAYS_OF_WEEK, SOLFEGIU_GROUPS } from '@/lib/types';
import { GraduationCap, Calendar, DoorOpen, FileText } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const SOLFEGIU = 'Solfegiu și teoria muzicii';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  schedule?: RecurringSchedule | null;
  defaultDayOfWeek?: number;
  defaultStartTime?: string;
  defaultCabinetId?: number | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const blank = {
  student_id: '', teacher_id: '', discipline: '', cabinet_id: '',
  day_of_week: '1', start_time: '16:00', end_time: '16:45', notes: '',
};

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function RecurringScheduleForm({ open, onClose, onSaved, schedule, defaultDayOfWeek, defaultStartTime, defaultCabinetId, showToast }: Props) {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  // Solfegiu is taught in groups (mică/medie/mare) — the group itself lives on
  // the student's own Solfegiu subscription (set in Elevi), not on the
  // schedule row. This just lets the admin see/set it right here too, while
  // scheduling the lesson, instead of needing a separate trip to the student.
  const [solfegiuGroup, setSolfegiuGroup] = useState('');

  const { data: studentsData } = useSWR('/api/students', fetcher);
  const { data: teachersData } = useSWR('/api/teachers', fetcher);
  const { data: cabinetsData } = useSWR('/api/cabinets', fetcher);
  const students: { id: number; name: string; subscriptions?: StudentSubscription[] }[] = studentsData?.students ?? [];

  useEffect(() => {
    if (form.discipline !== SOLFEGIU || !form.student_id) { setSolfegiuGroup(''); return; }
    const student = students.find(s => s.id === Number(form.student_id));
    const sub = student?.subscriptions?.find(x => x.instrument === SOLFEGIU);
    setSolfegiuGroup(sub?.group ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.discipline, form.student_id, studentsData]);

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
      const start = defaultStartTime ?? blank.start_time;
      setForm({
        ...blank,
        day_of_week: defaultDayOfWeek !== undefined ? String(defaultDayOfWeek) : blank.day_of_week,
        start_time: start,
        end_time: addMinutes(start, 45),
        cabinet_id: defaultCabinetId ? String(defaultCabinetId) : blank.cabinet_id,
      });
    }
    setErrors({});
  }, [schedule, open, defaultDayOfWeek, defaultStartTime, defaultCabinetId]);

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
        return;
      }

      // Solfegiu: persist the group pick onto the student's own subscription
      // (same field Elevi edits), only if it actually changed.
      if (form.discipline === SOLFEGIU) {
        const student = students.find(s => s.id === Number(form.student_id));
        const currentSub = student?.subscriptions?.find(x => x.instrument === SOLFEGIU);
        const currentGroup = currentSub?.group ?? '';
        if (student?.subscriptions && currentGroup !== solfegiuGroup) {
          const nextSubs = student.subscriptions.map(x =>
            x.instrument === SOLFEGIU ? { ...x, group: (solfegiuGroup || null) as StudentSubscription['group'] } : x,
          );
          await fetch(`/api/students/${student.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptions: nextSubs }),
          });
        }
      }

      showToast(schedule ? 'Orar fix actualizat!' : 'Orar fix adăugat!', 'success');
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

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
              options={students.map(s => ({ value: s.id, label: s.name }))}
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
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Disciplină"
              value={form.discipline}
              onChange={set('discipline')}
              placeholder="Fără disciplină specificată"
              options={INSTRUMENTS.map(i => ({ value: i, label: i }))}
            />
            {form.discipline === SOLFEGIU && (
              <Select
                label="Grupă"
                value={solfegiuGroup}
                onChange={e => setSolfegiuGroup(e.target.value)}
                placeholder="Fără grupă atribuită"
                options={SOLFEGIU_GROUPS}
              />
            )}
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

        <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>Anulează</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Se salvează…' : schedule ? 'Salvează' : 'Adaugă orar fix'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
