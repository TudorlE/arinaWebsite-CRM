'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

const COURSES = ['Pian', 'Tobe', 'Canto', 'Solfegiu', 'Chitară'];

const inp = (err?: boolean): React.CSSProperties => ({
  width: '100%', padding: '14px 16px', borderRadius: 14, border: `2px solid ${err ? '#FCA5A5' : '#E5E7EB'}`,
  fontSize: 14, fontWeight: 500, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit',
  background: err ? '#FFF5F5' : '#FAFAFA', color: '#1a1a1a',
});

export default function CTA() {
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
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const d = await res.json().catch(() => ({}));
        setApiError(d.error ?? 'Eroare la trimitere. Încearcă din nou.');
      }
    } catch {
      setApiError('Eroare de rețea. Verifică conexiunea.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="inscriere" style={{ padding: '112px 24px', background: 'linear-gradient(135deg, #1a1208 0%, #2d2000 50%, #1a1208 100%)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }} className="cta-grid">
        {/* Left */}
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 24, background: 'rgba(244,168,92,0.18)', color: '#F4A85C' }}>Înscrie-te</span>
          <h2 style={{ fontSize: 'clamp(40px, 5vw, 62px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
            Fă primul pas
            <span style={{ display: 'block', color: '#F4A85C' }}>către lumea muzicii.</span>
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 40px' }}>
            Completează formularul și te vom contacta în cel mai scurt timp pentru prima lecție de probă — gratuită.
          </p>
          {['Prima lecție gratuită', 'Fără contract pe termen lung', 'Program flexibil', 'Profesori certificați'].map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(244,168,92,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#F4A85C', flexShrink: 0 }}>✓</span>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500, fontSize: 15 }}>{b}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <div style={{ background: '#fff', borderRadius: 28, padding: '40px 36px', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>🎵</div>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: '#1a1a1a', margin: '0 0 12px' }}>Felicitări!</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.7, margin: '0 0 28px' }}>Am primit cererea ta și te vom contacta în 24 de ore pentru a stabili prima lecție.</p>
                <button onClick={() => { setDone(false); setForm({ name: '', phone: '', email: '', age: '', course: '', message: '' }); }}
                  style={{ padding: '12px 28px', borderRadius: 14, fontWeight: 700, background: 'linear-gradient(135deg,#F4A85C,#F4A85C)', color: '#1a1a1a', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                  Trimite altă cerere
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', margin: '0 0 28px' }}>Înregistrare</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input placeholder="Numele tău *" value={form.name} onChange={set('name')} style={inp(errors.name)}
                    onFocus={e => { (e.target as HTMLElement).style.borderColor = '#F4A85C'; }}
                    onBlur={e => { (e.target as HTMLElement).style.borderColor = errors.name ? '#FCA5A5' : '#E5E7EB'; }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <input placeholder="Telefon *" value={form.phone} onChange={set('phone')} style={inp(errors.phone)}
                      onFocus={e => { (e.target as HTMLElement).style.borderColor = '#F4A85C'; }}
                      onBlur={e => { (e.target as HTMLElement).style.borderColor = errors.phone ? '#FCA5A5' : '#E5E7EB'; }} />
                    <input placeholder="Vârsta" value={form.age} onChange={set('age')} style={inp()}
                      onFocus={e => { (e.target as HTMLElement).style.borderColor = '#F4A85C'; }}
                      onBlur={e => { (e.target as HTMLElement).style.borderColor = '#E5E7EB'; }} />
                  </div>
                  <input placeholder="Email *" type="email" value={form.email} onChange={set('email')} style={inp(errors.email)}
                    onFocus={e => { (e.target as HTMLElement).style.borderColor = '#F4A85C'; }}
                    onBlur={e => { (e.target as HTMLElement).style.borderColor = errors.email ? '#FCA5A5' : '#E5E7EB'; }} />
                  <select value={form.course} onChange={set('course')} style={{ ...inp(errors.course), color: form.course ? '#1a1a1a' : '#9ca3af' }}>
                    <option value="">Cursul dorit *</option>
                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <textarea placeholder="Mesaj (opțional)" value={form.message} onChange={set('message')} rows={3}
                    style={{ ...inp(), resize: 'none' }}
                    onFocus={e => { (e.target as HTMLElement).style.borderColor = '#F4A85C'; }}
                    onBlur={e => { (e.target as HTMLElement).style.borderColor = '#E5E7EB'; }} />
                  <button type="submit" disabled={loading}
                    style={{ width: '100%', padding: '16px', borderRadius: 16, fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg,#F4A85C,#F4A85C)', color: '#1a1a1a', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}>
                    {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><span className="spin" style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1a1a1a' }} />Se trimite…</span> : 'Înscrie-te acum →'}
                  </button>
                  {apiError && (
                    <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FFF5F5', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 13, fontWeight: 500 }}>
                      ⚠️ {apiError}
                    </div>
                  )}
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0 }}>Prima lecție de probă este gratuită · Fără obligații</p>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
      <style>{`@media (max-width: 900px) { .cta-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
