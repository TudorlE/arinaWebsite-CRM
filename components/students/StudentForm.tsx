'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import { INSTRUMENTS, Student, StudentSubscription, StudentStatus, STUDENT_STATUSES } from '@/lib/types';
import { PRICING, LESSON_COUNTS, subscriptionAmount, perLessonPrice, sumSubscriptions, type PlanType, type LessonCount } from '@/lib/pricing';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  student?: Student | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const blank = {
  name: '', birth_date: '', phone: '', email: '',
  parent_name: '', parent_phone: '',
  instruments: [] as string[],
  subscriptions: [] as StudentSubscription[],
  notes: '',
};

/** A brand-new default subscription for an instrument — 4 lecții, abonament nou, activ. */
function defaultSubscriptionFor(instrument: string): StudentSubscription | null {
  const svc = PRICING[instrument];
  if (!svc) return null;
  const lessons: LessonCount = 4;
  const plan: PlanType = 'new';
  return { instrument, plan, lessons, monthly_fee: subscriptionAmount(instrument, plan, lessons) ?? 0, teacher_id: null, status: 'active' };
}

/** students.status (legacy single field, used by lists/filters elsewhere) mirrors
 * the "best" per-instrument status: active > paused > inactive. */
function derivedStatus(subscriptions: StudentSubscription[]): StudentStatus {
  const order: StudentStatus[] = ['active', 'paused', 'inactive'];
  return order.find(st => subscriptions.some(s => (s.status ?? 'active') === st)) ?? 'active';
}

export default function StudentForm({ open, onClose, onSaved, student, showToast }: Props) {
  const [form, setForm]     = useState(blank);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const { data: teachersData } = useSWR('/api/teachers', fetcher);

  useEffect(() => {
    if (student) {
      const instruments = student.instruments ?? [];
      // Older rows have no per-instrument breakdown — best-effort backfill so
      // the admin sees something sensible and can adjust immediately.
      let subscriptions = student.subscriptions ?? [];
      if (subscriptions.length === 0 && instruments.length > 0) {
        subscriptions = instruments
          .map((instr, i) => {
            const def = defaultSubscriptionFor(instr);
            if (!def) return null;
            return i === 0
              ? { ...def, monthly_fee: Number(student.monthly_fee) || def.monthly_fee, teacher_id: student.teacher_id ?? null, status: student.status ?? 'active' }
              : def;
          })
          .filter((s): s is StudentSubscription => s != null);
      }
      setForm({
        name: student.name,
        birth_date: student.birth_date ?? '',
        phone: student.phone ?? '',
        email: student.email ?? '',
        parent_name: student.parent_name ?? '',
        parent_phone: student.parent_phone ?? '',
        instruments,
        subscriptions,
        notes: student.notes ?? '',
      });
    } else {
      setForm(blank);
    }
    setErrors({});
  }, [student, open]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const toggleInstrument = (instr: string) => {
    setForm(prev => {
      const has = prev.instruments.includes(instr);
      const instruments = has ? prev.instruments.filter(i => i !== instr) : [...prev.instruments, instr];
      let subscriptions = prev.subscriptions;
      if (has) {
        subscriptions = subscriptions.filter(s => s.instrument !== instr);
      } else if (!subscriptions.some(s => s.instrument === instr)) {
        const def = defaultSubscriptionFor(instr);
        subscriptions = def ? [...subscriptions, def] : subscriptions;
      }
      return { ...prev, instruments, subscriptions };
    });
    setErrors(prev => ({ ...prev, instruments: false }));
  };

  const updateSubscription = (instrument: string, patch: Partial<Pick<StudentSubscription, 'plan' | 'lessons' | 'teacher_id' | 'status'>>) => {
    setForm(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.map(s => {
        if (s.instrument !== instrument) return s;
        if ('teacher_id' in patch) return { ...s, teacher_id: patch.teacher_id ?? null };
        if ('status' in patch) return { ...s, status: patch.status ?? 'active' };
        const plan = patch.plan ?? s.plan;
        const lessons = patch.lessons ?? s.lessons;
        return { ...s, plan, lessons, monthly_fee: subscriptionAmount(instrument, plan, lessons) ?? s.monthly_fee };
      }),
    }));
  };

  const totalFee = sumSubscriptions(form.subscriptions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim())             newErrors.name = true;
    if (form.instruments.length === 0) newErrors.instruments = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    // students.teacher_id (single FK, used by attendance/stats/schedule elsewhere)
    // mirrors the first instrument's assigned teacher, since each instrument
    // can now have its own.
    const primaryTeacherId = form.subscriptions.find(s => s.teacher_id)?.teacher_id ?? null;
    const overallStatus = derivedStatus(form.subscriptions);

    setLoading(true);
    try {
      const url    = student ? `/api/students/${student.id}` : '/api/students';
      const method = student ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          birth_date: form.birth_date || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          parent_name: form.parent_name.trim() || null,
          parent_phone: form.parent_phone.trim() || null,
          instruments: form.instruments,
          subscriptions: form.subscriptions,
          monthly_fee: totalFee,
          notes: form.notes, status: overallStatus,
          teacher_id: primaryTeacherId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? 'Eroare la salvare', 'error');
      } else {
        showToast(student ? 'Elev actualizat!' : 'Elev adăugat!', 'success');
        onSaved();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const teachers = teachersData?.teachers ?? [];

  const INSTRUMENT_COLORS: Record<string, string> = {
    'Piano': 'indigo', 'Chitară': 'purple', 'Tobe': 'yellow',
    'Canto': 'blue', 'Solfegiu și teoria muzicii': 'red',
  };
  const colorMap: Record<string, { sel: string; unsel: string }> = {
    indigo: { sel: 'bg-brand-600 text-white border-brand-600', unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-brand-400' },
    purple: { sel: 'bg-accent-600 text-white border-accent-600', unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-accent-400' },
    yellow: { sel: 'bg-yellow-500 text-white border-yellow-500', unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-yellow-400' },
    blue:   { sel: 'bg-blue-600 text-white border-blue-600',   unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-400' },
    green:  { sel: 'bg-green-600 text-white border-green-600',  unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-green-400' },
    red:    { sel: 'bg-red-500 text-white border-red-500',    unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-red-400' },
  };

  return (
    <Modal open={open} onClose={onClose} title={student ? 'Editează elev' : 'Adaugă elev nou'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nume complet *"    value={form.name}        onChange={set('name')}        shake={errors.name}        placeholder="Ana Ionescu" />
          <DatePicker
            label="Data nașterii (opțional)"
            value={form.birth_date}
            onChange={v => { setForm(prev => ({ ...prev, birth_date: v })); }}
          />
          <Input label="Telefon (opțional)" value={form.phone}       onChange={set('phone')}       placeholder="+373 69 000 000" />
          <Input label="Email (opțional)"   value={form.email}       onChange={set('email')}       type="email" placeholder="elev@exemplu.ro" />
          <Input label="Nume prenume părinte (opțional)" value={form.parent_name}  onChange={set('parent_name')}  placeholder="Maria Ionescu" />
          <Input label="Telefon părinte (opțional)"      value={form.parent_phone} onChange={set('parent_phone')} placeholder="+373 69 000 000" />
        </div>

        {/* Instruments multi-select */}
        <div className="flex flex-col gap-2">
          <label className={`text-sm font-medium transition-colors duration-150 ${errors.instruments ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
            Instrumente <span className="text-red-500">*</span>
          </label>
          <div className={`flex flex-wrap gap-2 p-2 rounded-xl border transition-all duration-150
            ${errors.instruments ? 'border-red-500 animate-field-error bg-red-50/50 dark:bg-red-900/10' : 'border-transparent'}`}>
            {INSTRUMENTS.map(instr => {
              const color = INSTRUMENT_COLORS[instr] ?? 'indigo';
              const selected = form.instruments.includes(instr);
              const cls = colorMap[color];
              return (
                <button
                  key={instr}
                  type="button"
                  onClick={() => toggleInstrument(instr)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 select-none
                    ${selected ? cls.sel : cls.unsel}`}
                >
                  {instr}
                </button>
              );
            })}
          </div>
          {errors.instruments && (
            <p className="text-xs text-red-500 animate-fade-in">Selectează cel puțin un instrument</p>
          )}
          <p className="text-xs text-slate-400">Poți alege mai multe instrumente — fiecare are propriul abonament mai jos.</p>
        </div>

        {/* Abonamente — unul per instrument, aceeași logică de prețuri ca la Plăți */}
        <div className="rounded-xl border border-brand-200 dark:border-brand-900/50 bg-brand-50/60 dark:bg-brand-900/15 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">Abonamente</p>
            {form.subscriptions.length > 0 && (
              <span className="text-sm font-bold text-brand-700 dark:text-brand-300">Total: {totalFee} lei/lună</span>
            )}
          </div>
          {form.instruments.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Selectează un instrument mai sus ca să apară prețurile.</p>
          ) : (
            <div className="space-y-2.5">
              {form.instruments.map(instr => {
                const sub = form.subscriptions.find(s => s.instrument === instr);
                const svcP = PRICING[instr];
                if (!svcP || !sub) return null;
                const isFlatP = svcP.flatMonthly != null;
                const perLessonP = perLessonPrice(instr, sub.plan);
                return (
                  <div key={instr} className="rounded-lg border border-brand-200/70 dark:border-brand-900/40 bg-white/70 dark:bg-slate-900/30 p-2.5 space-y-2">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{svcP.label}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Select
                        label="Tip abonament"
                        value={sub.plan}
                        onChange={e => updateSubscription(instr, { plan: e.target.value as PlanType })}
                        disabled={isFlatP}
                        options={[
                          { value: 'old', label: 'Abonament vechi' },
                          { value: 'new', label: 'Abonament nou' },
                        ]}
                      />
                      {!isFlatP && (
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nr. lecții / lună</label>
                          <div className="flex gap-1.5">
                            {LESSON_COUNTS.map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => updateSubscription(instr, { lessons: n })}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold border transition-colors
                                  ${sub.lessons === n
                                    ? 'bg-brand-600 text-white border-brand-600'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-brand-400'}`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Select
                        label="Profesor"
                        value={sub.teacher_id ?? ''}
                        onChange={e => updateSubscription(instr, { teacher_id: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Atribuie profesor"
                        options={teachers.map((t: { id: number; name: string }) => ({ value: t.id, label: t.name }))}
                      />
                      <Select
                        label="Status"
                        value={sub.status ?? 'active'}
                        onChange={e => updateSubscription(instr, { status: e.target.value as StudentStatus })}
                        options={STUDENT_STATUSES.map(st => ({ value: st.value, label: st.label }))}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-brand-200/50 dark:border-brand-900/30">
                      <span>{isFlatP ? `Lecție de grup — ${svcP.flatMonthly} lei/lună` : <>Preț per lecție: <strong className="text-slate-700 dark:text-slate-200">{perLessonP} lei</strong></>}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{sub.monthly_fee} lei/lună</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Observații</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            placeholder="Observație rapidă despre elev…"
            className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800
              text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Anulează</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Se salvează…' : student ? 'Salvează' : 'Adaugă elev'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
