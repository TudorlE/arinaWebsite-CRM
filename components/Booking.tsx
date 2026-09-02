'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { EASE } from '@/components/motionx';

const COURSES = ['Pian', 'Tobe', 'Canto', 'Chitară', 'Solfegiu'];

const Ctx = createContext<{ open: () => void }>({ open: () => {} });
export const useBooking = () => useContext(Ctx);

const field: React.CSSProperties = {
  width: '100%', padding: '13px 2px', border: 'none', borderBottom: '1px solid var(--line-strong)',
  background: 'transparent', color: 'var(--tx)', fontSize: 15, fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.2s',
};

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener('arry:book', h);
    return () => window.removeEventListener('arry:book', h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <Ctx.Provider value={{ open: show }}>
      {children}
      <AnimatePresence>{open && <Dialog onClose={() => setOpen(false)} />}</AnimatePresence>
    </Ctx.Provider>
  );
}

function Dialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', age: '', course: '', message: '' });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, boolean> = {};
    if (!form.name.trim()) errs.name = true;
    if (!form.phone.trim()) errs.phone = true;
    if (!form.email.trim()) errs.email = true;
    if (!form.course) errs.course = true;
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true); setApiError(null);
    try {
      const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) setDone(true);
      else { const d = await res.json().catch(() => ({})); setApiError(d.error ?? 'Eroare la trimitere. Încearcă din nou.'); }
    } catch { setApiError('Eroare de rețea. Verifică conexiunea.'); }
    finally { setLoading(false); }
  };

  const ef = (e: React.FocusEvent<HTMLElement>) => { e.target.style.borderBottomColor = 'var(--accent)'; };
  const eb = (k: string) => (e: React.FocusEvent<HTMLElement>) => { e.target.style.borderBottomColor = errors[k] ? 'var(--red)' : 'var(--line-strong)'; };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(6,5,4,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{ width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', background: 'var(--bg)', border: '1px solid var(--line-strong)' }}
        className="bk-grid"
      >
        {/* Left rail */}
        <div className="bk-rail" style={{ background: 'var(--bg-alt)', padding: '40px 34px', borderRight: '1px solid var(--line)', position: 'relative' }}>
          <div style={{ color: 'var(--accent)' }}><LogoMark size={40} withCord={false} /></div>
          <p style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 26, color: 'var(--tx)', margin: '26px 0 14px', lineHeight: 1.15 }}>
            Programează o lecție de probă
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--tx-mut)', lineHeight: 1.7, margin: 0 }}>
            Prima ședință este gratuită și fără obligații. Te sunăm în maximum 24 de ore ca să stabilim ziua și profesorul potrivit.
          </p>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Prima lecție gratuită', 'Fără contract pe termen lung', 'Profesori — muzicieni activi'].map(b => (
              <div key={b} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--tx)' }}>
                <span style={{ width: 5, height: 5, background: 'var(--accent)', borderRadius: '50%', flexShrink: 0 }} />{b}
              </div>
            ))}
          </div>
          <a href="tel:+37360081991" style={{ position: 'absolute', left: 34, bottom: 34, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--tx)' }} className="bk-phone">
            sau sună: +373 60 081 991
          </a>
        </div>

        {/* Form */}
        <div style={{ padding: '34px 34px 38px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
            <button onClick={onClose} aria-label="Închide" style={{ width: 36, height: 36, border: '1px solid var(--line)', color: 'var(--tx-mut)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {done ? (
            <div style={{ padding: '30px 0', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 24, color: 'var(--tx)', margin: '0 0 12px' }}>Îți mulțumim!</p>
              <p style={{ color: 'var(--tx-mut)', lineHeight: 1.7, margin: '0 0 26px', fontSize: 14 }}>Am primit cererea ta. Te contactăm în 24 de ore.</p>
              <button onClick={onClose} className="btn-outline">Închide</button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <input placeholder="Numele tău *" value={form.name} onChange={set('name')} onFocus={ef} onBlur={eb('name')} style={{ ...field, borderBottomColor: errors.name ? 'var(--red)' : 'var(--line-strong)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <input placeholder="Telefon *" value={form.phone} onChange={set('phone')} onFocus={ef} onBlur={eb('phone')} style={{ ...field, borderBottomColor: errors.phone ? 'var(--red)' : 'var(--line-strong)' }} />
                <input placeholder="Vârsta" value={form.age} onChange={set('age')} onFocus={ef} onBlur={eb('age')} style={field} />
              </div>
              <input placeholder="Email *" type="email" value={form.email} onChange={set('email')} onFocus={ef} onBlur={eb('email')} style={{ ...field, borderBottomColor: errors.email ? 'var(--red)' : 'var(--line-strong)' }} />
              <select value={form.course} onChange={set('course')} onFocus={ef} onBlur={eb('course')} style={{ ...field, borderBottomColor: errors.course ? 'var(--red)' : 'var(--line-strong)', color: form.course ? 'var(--tx)' : 'var(--tx-faint)' }}>
                <option value="" style={{ background: '#16110D' }}>Cursul dorit *</option>
                {COURSES.map(c => <option key={c} value={c} style={{ background: '#16110D' }}>{c}</option>)}
              </select>
              <textarea placeholder="Mesaj (opțional)" value={form.message} onChange={set('message')} rows={2} onFocus={ef} onBlur={eb('message')} style={{ ...field, resize: 'none' }} />
              <button type="submit" disabled={loading} className="btn-outline solid" style={{ width: '100%', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
                {loading ? 'Se trimite…' : 'Trimite cererea'}
              </button>
              {apiError && <div style={{ padding: '12px 14px', border: '1px solid var(--red)', background: 'rgba(225,29,29,0.1)', color: '#F2C6C6', fontSize: 13 }}>{apiError}</div>}
              <p style={{ fontSize: 11.5, color: 'var(--tx-faint)', margin: 0 }}>Prima lecție de probă este gratuită · Fără obligații</p>
            </form>
          )}
        </div>
      </motion.div>

      <style>{`
        @media (max-width: 720px) {
          .bk-grid { grid-template-columns: 1fr !important; }
          .bk-rail { border-right: 0 !important; border-bottom: 1px solid var(--line) !important; padding-bottom: 30px !important; }
          .bk-phone { position: static !important; display: inline-block; margin-top: 22px; }
        }
      `}</style>
    </motion.div>
  );
}

/** Fire from anywhere (server or client) without importing the context. */
export function openBooking() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('arry:book'));
}
