'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { INSTRUMENTS, Student } from '@/lib/types';
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
  name: '', age: '', phone: '', email: '',
  instruments: [] as string[], teacher_id: '',
};

export default function StudentForm({ open, onClose, onSaved, student, showToast }: Props) {
  const [form, setForm]     = useState(blank);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const { data: teachersData } = useSWR('/api/teachers', fetcher);

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name,
        age: String(student.age),
        phone: student.phone,
        email: student.email,
        instruments: student.instruments ?? [],
        teacher_id: String(student.teacher_id ?? ''),
      });
    } else {
      setForm(blank);
    }
    setErrors({});
  }, [student, open]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const toggleInstrument = (instr: string) => {
    setForm(prev => ({
      ...prev,
      instruments: prev.instruments.includes(instr)
        ? prev.instruments.filter(i => i !== instr)
        : [...prev.instruments, instr],
    }));
    setErrors(prev => ({ ...prev, instruments: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim())         newErrors.name = true;
    if (!form.age)                 newErrors.age = true;
    if (!form.phone.trim())        newErrors.phone = true;
    if (!form.email.trim())        newErrors.email = true;
    if (form.instruments.length === 0) newErrors.instruments = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const url    = student ? `/api/students/${student.id}` : '/api/students';
      const method = student ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          teacher_id: form.teacher_id ? Number(form.teacher_id) : null,
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
    'Canto': 'blue', 'Teoria muzicii': 'green', 'Solfegiu': 'red',
  };
  const colorMap: Record<string, { sel: string; unsel: string }> = {
    indigo: { sel: 'bg-indigo-600 text-white border-indigo-600', unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-indigo-400' },
    purple: { sel: 'bg-purple-600 text-white border-purple-600', unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-purple-400' },
    yellow: { sel: 'bg-yellow-500 text-white border-yellow-500', unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-yellow-400' },
    blue:   { sel: 'bg-blue-600 text-white border-blue-600',   unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-400' },
    green:  { sel: 'bg-green-600 text-white border-green-600',  unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-green-400' },
    red:    { sel: 'bg-red-500 text-white border-red-500',    unsel: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-red-400' },
  };

  return (
    <Modal open={open} onClose={onClose} title={student ? 'Editează elev' : 'Adaugă elev nou'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nume complet"      value={form.name}        onChange={set('name')}        shake={errors.name}        placeholder="Ana Ionescu" />
          <Input label="Vârstă"            value={form.age}         onChange={set('age')}         shake={errors.age}         type="number" min={4} max={100} placeholder="12" />
          <Input label="Telefon"           value={form.phone}       onChange={set('phone')}       shake={errors.phone}       placeholder="+373 69 000 000" />
          <Input label="Email"             value={form.email}       onChange={set('email')}       shake={errors.email}       type="email" placeholder="elev@exemplu.ro" />

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
        </div>

        <Select
          label="Profesor"
          value={form.teacher_id}
          onChange={set('teacher_id')}
          placeholder="Atribuie profesor"
          options={teachers.map((t: { id: number; name: string }) => ({ value: t.id, label: t.name }))}
        />

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
