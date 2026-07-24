'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const BARS = [38, 78, 50, 100, 66, 88, 42, 72, 56, 84];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingNotice, setPendingNotice] = useState<'pending' | 'rejected' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const google = params.get('google');
    const err = params.get('error');
    if (google === 'pending') setPendingNotice('pending');
    else if (google === 'rejected') setPendingNotice('rejected');
    else if (err === 'google_not_configured') setError('Google Login nu este configurat încă.');
    else if (err) setError('Autentificare Google eșuată. Încearcă din nou.');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setPendingNotice(null); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.status === 'pending' || data.status === 'rejected') setPendingNotice(data.status);
        setError(data.error ?? 'Conectare eșuată');
      } else {
        router.push('/'); router.refresh();
      }
    } catch {
      setError('Eroare de rețea. Te rugăm să încerci din nou.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      background: `
        radial-gradient(680px 380px at 12% 8%, rgba(139,40,217,0.18), transparent 62%),
        radial-gradient(600px 340px at 90% 90%, rgba(201,160,32,0.12), transparent 60%),
        radial-gradient(500px 280px at 78% 12%, rgba(255,213,74,0.08), transparent 60%),
        linear-gradient(180deg, #080514 0%, #0e0820 50%, #080514 100%)
      `,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative glow blobs */}
      <div style={{ position: 'absolute', top: '8%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(109,40,217,0.1)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: 360, height: 360, borderRadius: '50%', background: 'rgba(201,160,32,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', width: '100%', maxWidth: 380,
          borderRadius: 28, padding: '36px 32px',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 2.5, height: 40, minWidth: 52, flexShrink: 0,
            padding: '5px 9px 4px',
            background: 'linear-gradient(145deg, #180c30, #261550)',
            borderRadius: 12, border: '1.5px solid rgba(201,160,32,0.45)',
            boxShadow: '0 0 20px rgba(201,160,32,0.18)',
          }}>
            {BARS.map((h, i) => (
              <div key={i} style={{
                width: 2.5, borderRadius: 2, height: `${h}%`,
                background: 'linear-gradient(to top, #9b7515, #c9a020, #f4d060)',
                animation: `loginBar ${0.65 + (i % 4) * 0.14}s ease-in-out ${i * 0.09}s infinite alternate`,
                transformOrigin: 'bottom',
              }} />
            ))}
          </div>
          <div>
            <p style={{ fontWeight: 800, color: '#fff', fontSize: 15, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Arry Production
            </p>
            <p style={{ color: 'rgba(201,160,32,0.65)', fontSize: 9.5, margin: '3px 0 0', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              CRM
            </p>
          </div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Autentificare
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 28px' }}>
          Acces rezervat membrilor echipei.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
              Email
            </label>
            <input
              type="email" required autoFocus
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="admin@arryproduction.ro"
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(201,160,32,0.55)'; }}
              onBlur={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
              Parolă
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} required
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '13px 44px 13px 16px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(201,160,32,0.55)'; }}
                onBlur={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, display: 'flex' }}>
                {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          {/* Notices */}
          {pendingNotice === 'pending' && (
            <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', margin: 0 }}>Cont în așteptare</p>
                <p style={{ fontSize: 11.5, color: 'rgba(245,158,11,0.75)', margin: '3px 0 0', lineHeight: 1.5 }}>Contul tău este în curs de aprobare de către un administrator.</p>
              </div>
            </div>
          )}
          {pendingNotice === 'rejected' && (
            <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', margin: 0 }}>Cont respins</p>
                <p style={{ fontSize: 11.5, color: 'rgba(239,68,68,0.75)', margin: '3px 0 0', lineHeight: 1.5 }}>Contactează un administrator pentru detalii.</p>
              </div>
            </div>
          )}
          {error && !pendingNotice && (
            <p style={{ fontSize: 13, color: '#f87171', padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', margin: 0 }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{
              width: '100%', height: 48, borderRadius: 99,
              background: 'linear-gradient(135deg, var(--gold-dark), var(--gold), #f4d060)',
              color: '#0a0a0a', fontSize: 14.5, fontWeight: 700,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.65 : 1, transition: 'all 0.22s',
              boxShadow: '0 6px 24px rgba(201,160,32,0.35)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.boxShadow = '0 8px 32px rgba(201,160,32,0.55)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.boxShadow = '0 6px 24px rgba(201,160,32,0.35)'; }}>
            {loading ? 'Se verifică…' : 'Intră în CRM'}
          </button>

          {/* Google */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>sau</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>
          <a href="/api/auth/google"
            style={{ width: '100%', height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none', transition: 'all 0.18s', boxSizing: 'border-box', cursor: 'pointer' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.08)'; el.style.borderColor = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.04)'; el.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
            <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuă cu Google
          </a>
        </form>

        <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 12.5, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.18s' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>
          Nu ai cont? <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Creează unul →</span>
        </Link>
      </motion.div>

      <style>{`
        @keyframes loginBar { 0% { transform: scaleY(0.25); } 100% { transform: scaleY(1); } }
        input::placeholder { color: rgba(255,255,255,0.22) !important; }
      `}</style>
    </div>
  );
}
