'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BLACK, OFFWHITE, LIME, HAIRLINE_ON_BLACK, display, body } from './theme';

const COURSES = ['Pian', 'Tobe', 'Canto', 'Solfegiu', 'Chitară'];

const inputStyle = (err?: boolean): React.CSSProperties => ({
  width: '100%', padding: '14px 4px', border: 'none', borderBottom: `1px solid ${err ? '#FF5C5C' : HAIRLINE_ON_BLACK}`,
  fontSize: 15, fontWeight: 500, outline: 'none', transition: 'border-color 0.2s', fontFamily: body,
  background: 'transparent', color: OFFWHITE, borderRadius: 0,
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
    <section id="inscriere" style={{ position: 'relative', padding: '140px 24px', background: BLACK, overflow: 'hidden' }}>
      {/* Cinematic backdrop */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1600&q=80&fit=crop')`,
        backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.22, filter: 'grayscale(1) contrast(1.2)',
      }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, #020707 0%, rgba(2,7,7,0.85) 50%, #020707 100%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 80, alignItems: 'start' }} className="cta-grid">
        {/* Left */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: body, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24, color: LIME }}>
            <span style={{ width: 24, height: 1, background: LIME, display: 'inline-block' }} /> Înscrie-te
          </span>
          <h2 style={{ fontFamily: display, fontSize: 'clamp(48px, 8vw, 108px)', color: OFFWHITE, lineHeight: 0.86, letterSpacing: '-0.01em', margin: '0 0 32px', textTransform: 'uppercase' }}>
            Ready<br /><span style={{ color: LIME }}>to find</span><br />your sound?
          </h2>
          <p style={{ fontFamily: body, fontSize: 17, color: 'rgba(244,243,237,0.55)', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 460 }}>
            Completează formularul și te vom contacta în cel mai scurt timp pentru prima lecție de probă — gratuită.
          </p>
          {['Prima lecție gratuită', 'Fără contract pe termen lung', 'Program flexibil', 'Profesori certificați'].map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.08 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ width: 5, height: 5, background: LIME, flexShrink: 0 }} />
              <span style={{ fontFamily: body, color: 'rgba(244,243,237,0.75)', fontWeight: 500, fontSize: 14 }}>{b}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}>
          <div style={{ border: `1px solid ${HAIRLINE_ON_BLACK}`, padding: '40px 36px' }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 64, height: 64, background: LIME, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontSize: 28, color: BLACK }}>✓</div>
                <h3 style={{ fontFamily: display, fontSize: 26, color: OFFWHITE, margin: '0 0 14px', textTransform: 'uppercase' }}>Felicitări!</h3>
                <p style={{ fontFamily: body, color: 'rgba(244,243,237,0.55)', lineHeight: 1.7, margin: '0 0 28px' }}>Am primit cererea ta și te vom contacta în 24 de ore pentru a stabili prima lecție.</p>
                <button onClick={() => { setDone(false); setForm({ name: '', phone: '', email: '', age: '', course: '', message: '' }); }}
                  style={{ padding: '13px 28px', fontWeight: 700, background: LIME, color: BLACK, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: body, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Trimite altă cerere
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3 style={{ fontFamily: display, fontSize: 22, color: OFFWHITE, margin: '0 0 28px', textTransform: 'uppercase', letterSpacing: '0.01em' }}>Înregistrare</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input placeholder="Numele tău *" value={form.name} onChange={set('name')} style={inputStyle(errors.name)} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <input placeholder="Telefon *" value={form.phone} onChange={set('phone')} style={inputStyle(errors.phone)} />
                    <input placeholder="Vârsta" value={form.age} onChange={set('age')} style={inputStyle()} />
                  </div>
                  <input placeholder="Email *" type="email" value={form.email} onChange={set('email')} style={inputStyle(errors.email)} />
                  <select value={form.course} onChange={set('course')} style={{ ...inputStyle(errors.course), color: form.course ? OFFWHITE : 'rgba(244,243,237,0.4)', appearance: 'none' }}>
                    <option value="" style={{ color: BLACK }}>Cursul dorit *</option>
                    {COURSES.map(c => <option key={c} value={c} style={{ color: BLACK }}>{c}</option>)}
                  </select>
                  <textarea placeholder="Mesaj (opțional)" value={form.message} onChange={set('message')} rows={2}
                    style={{ ...inputStyle(), resize: 'none' }} />
                  <button type="submit" disabled={loading}
                    style={{ width: '100%', padding: '16px', marginTop: 18, fontSize: 14, fontWeight: 700, background: LIME, color: BLACK, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.2s', fontFamily: body, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {loading ? 'Se trimite…' : 'Înscrie-te acum →'}
                  </button>
                  {apiError && (
                    <div style={{ padding: '12px 16px', border: '1px solid #FF5C5C', color: '#FF8080', fontSize: 13, fontWeight: 500, fontFamily: body, marginTop: 4 }}>
                      ⚠ {apiError}
                    </div>
                  )}
                  <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(244,243,237,0.35)', margin: '8px 0 0', fontFamily: body, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Prima lecție de probă este gratuită · Fără obligații</p>
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
