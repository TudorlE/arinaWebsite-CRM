'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Clock, Mail, User as UserIcon, Lock } from 'lucide-react';
import { usePendingAutoLogin } from '@/lib/usePendingAutoLogin';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [rejected, setRejected] = useState(false);

  // Chiar dacă rămâne pe acest ecran, intră automat de îndată ce un
  // administrator îi aprobă contul — fără să mai revină să reintroducă datele.
  usePendingAutoLogin(success && !rejected, form.email, form.password, (ok, data) => {
    if (ok) { router.push('/admin'); router.refresh(); }
    else if (data.status === 'rejected') setRejected(true);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Parolele nu coincid');
      return;
    }
    if (form.password.length < 6) {
      setError('Parola trebuie să aibă minim 6 caractere');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Înregistrare eșuată');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Eroare de rețea. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-100 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/70 p-8">
            <Clock className="w-8 h-8 mx-auto text-slate-400 mb-3" />
            {rejected ? (
              <p className="text-base font-semibold text-slate-900">Cont respins. Contactează un administrator.</p>
            ) : (
              <>
                <p className="text-base font-semibold text-slate-900">Cererea ta este în așteptare.</p>
                <p className="text-xs text-slate-400 mt-2">Te conectăm automat de îndată ce contul tău e aprobat.</p>
              </>
            )}
            <Link href="/login" className="inline-block mt-5 text-sm font-medium text-slate-700 hover:underline">
              Înapoi la conectare
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-100 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Creează cont</h1>
          <p className="text-sm text-slate-500 mt-1">Înregistrează-te pentru ArryMusic CRM</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/70 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Nume complet</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="Ion Popescu"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                  placeholder="email@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Parolă</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  minLength={6}
                  placeholder="Minim 6 caractere"
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Confirmă parola</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Se creează…' : 'Creează cont'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Ai deja cont?{' '}
          <Link href="/login" className="text-slate-700 font-semibold hover:underline">
            Conectează-te
          </Link>
        </p>
      </div>
    </div>
  );
}
