'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Payment, MONTHS } from '@/lib/types';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  payment?: Payment | null;
  defaultStudentId?: number;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const now = new Date();

/** Today's date in Moldova (Europe/Chisinau) as YYYY-MM-DD. */
function todayMoldova(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Chisinau',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(new Date()); // en-CA returns YYYY-MM-DD
}

const blank = {
  student_id: '', amount: '', month: String(now.getMonth() + 1),
  status: 'unpaid', payment_date: todayMoldova(), notes: '',
};

export default function PaymentForm({ open, onClose, onSaved, payment, defaultStudentId, showToast }: Props) {
  const [form, setForm]     = useState(blank);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const { data: studentsData } = useSWR('/api/students', fetcher);

  useEffect(() => {
    if (payment) {
      setForm({
        student_id: String(payment.student_id),
        amount: String(payment.amount),
        month: String(payment.month),
        status: payment.status,
        payment_date: payment.payment_date ?? todayMoldova(),
        notes: payment.notes ?? '',
      });
    } else {
      setForm({ ...blank, payment_date: todayMoldova(), student_id: defaultStudentId ? String(defaultStudentId) : '' });
    }
    setErrors({});
  }, [payment, open, defaultStudentId]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  // Auto-fill amount from student fee
  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sid = Number(e.target.value);
    const s = studentsData?.students?.find((x: { id: number; monthly_fee: number }) => x.id === sid);
    setForm(prev => ({ ...prev, student_id: e.target.value, amount: s ? String(s.monthly_fee) : prev.amount }));
    setErrors(prev => ({ ...prev, student_id: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.student_id) newErrors.student_id = true;
    if (!form.amount)     newErrors.amount = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setLoading(true);
    try {
      const url    = payment ? `/api/payments/${payment.id}` : '/api/payments';
      const method = payment ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          student_id: Number(form.student_id),
          amount: Number(form.amount),
          month: Number(form.month),
          year: now.getFullYear(),
          payment_date: form.payment_date || todayMoldova(),
          due_date: null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? 'Eroare la salvare', 'error');
      } else {
        showToast(payment ? 'Plată actualizată!' : 'Plată înregistrată!', 'success');
        onSaved();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const students = studentsData?.students ?? [];

  return (
    <Modal open={open} onClose={onClose} title={payment ? 'Editează plată' : 'Înregistrează plată'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Elev"
            value={form.student_id}
            onChange={handleStudentChange}
            shake={errors.student_id}
            placeholder="Selectează elev"
            options={students.map((s: { id: number; name: string }) => ({ value: s.id, label: s.name }))}
          />
          <Input label="Sumă (MDL)" value={form.amount} onChange={set('amount')} shake={errors.amount} type="number" min={0} />
          <Select
            label="Lună"
            value={form.month}
            onChange={set('month')}
            options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={set('status')}
            options={[
              { value: 'paid',    label: 'Plătit'   },
              { value: 'unpaid',  label: 'Neplătit' },
              { value: 'partial', label: 'Parțial'  },
            ]}
          />
          <Input label="Data" value={form.payment_date} onChange={set('payment_date')} type="date" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Note</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            placeholder="Note despre plată…"
            className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800
              text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Anulează</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Se salvează…' : payment ? 'Salvează' : 'Înregistrează plată'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
