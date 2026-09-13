'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Key, UserCircle, SlidersHorizontal, ChevronDown } from 'lucide-react';
import AccessDenied from '@/components/AccessDenied';
import PageBanner from '@/components/ui/PageBanner';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:    { label: 'Admin',    color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' },
  profesor: { label: 'Profesor', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  elev:     { label: 'Elev',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

type Me = { id: number; name: string; email: string; role: string };

export default function SettingsPage() {
  const { toasts, toast, remove } = useToast();
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [showPassForm, setShowPassForm] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user ?? null));
  }, []);

  const setField = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPasswords(p => ({ ...p, [f]: e.target.value }));

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { toast('Parolele nu se potrivesc', 'error'); return; }
    if (passwords.newPass.length < 6) { toast('Parola trebuie să aibă cel puțin 6 caractere', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      const data = await res.json();
      if (res.ok) {
        toast('Parola actualizată!', 'success');
        setPasswords({ current: '', newPass: '', confirm: '' });
        setShowPassForm(false);
      } else {
        toast(data.error ?? 'Eroare la actualizare', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (me?.role === 'administrator') return <AccessDenied title="Setări" />;

  return (
    <div className="flex flex-col flex-1">
      {/* ── Page Banner ──────────────────────────────────── */}
      <PageBanner
        icon={SlidersHorizontal}
        title="Setări"
        subtitle="Gestionează contul și preferințele"
        accent="#8B8FA3"
      />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-2xl mx-auto w-full">

        {/* ── My Role ──────────────────────────────────────── */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <UserCircle className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Contul meu</h2>
          </div>
          <div className="p-5">
            {me ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{me.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{me.email}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ROLE_LABELS[me.role]?.color ?? 'bg-slate-100 text-slate-600'}`}>
                  {ROLE_LABELS[me.role]?.label ?? me.role}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Se încarcă...</p>
            )}
          </div>
        </section>

        {/* ── Change Password ───────────────────────────────── */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setShowPassForm(p => !p); setPasswords({ current: '', newPass: '', confirm: '' }); }}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-xl"
          >
            <Key className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1 text-left">Schimbă Parola</h2>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showPassForm ? 'rotate-180' : ''}`} />
          </button>
          {showPassForm && (
            <form onSubmit={handleChangePassword} className="px-5 pb-5 space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4">
              <Input label="Parola curentă" type="password" value={passwords.current} onChange={setField('current')} required />
              <Input label="Parolă nouă"     type="password" value={passwords.newPass}  onChange={setField('newPass')}  required />
              <Input label="Confirmă parola" type="password" value={passwords.confirm}  onChange={setField('confirm')}  required />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Se actualizează…' : 'Actualizează Parola'}
                </Button>
              </div>
            </form>
          )}
        </section>

      </main>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
