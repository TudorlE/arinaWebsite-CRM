'use client';
import { motion } from 'framer-motion';

const info = [
  { icon: '📞', label: 'Telefon', value: '+40 700 000 000', href: 'tel:+40700000000' },
  { icon: '✉️', label: 'Email', value: 'contact@arryproduction.ro', href: 'mailto:contact@arryproduction.ro' },
  { icon: '📍', label: 'Adresă', value: 'Str. Muzicii nr. 1, București' },
  { icon: '🕐', label: 'Program', value: 'Lun–Vin: 10:00–20:00\nSâmbătă: 10:00–16:00' },
];

export default function Contact() {
  return (
    <section id="contact" style={{ padding: '120px 24px', background: 'var(--ink)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 68 }}>
          <span className="eyebrow" style={{ justifyContent: 'center', marginBottom: 20 }}>Contact</span>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 56px)', fontWeight: 900, color: '#fff', margin: '16px 0 18px', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
            Ia legătura cu noi
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.42)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Suntem aici să răspundem oricărei întrebări. Nu ezita să ne contactezi!
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }} className="contact-grid">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
            {info.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                {item.href ? (
                  <a href={item.href}
                    style={{ display: 'block', padding: '28px 24px', background: 'var(--ink)', transition: 'background-color 0.25s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--ink-raised)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--ink)'; }}>
                    <span style={{ fontSize: 24, display: 'block', marginBottom: 14 }}>{item.icon}</span>
                    <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 7px' }}>{item.label}</p>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#fff', margin: 0, lineHeight: 1.5 }}>{item.value}</p>
                  </a>
                ) : (
                  <div style={{ padding: '28px 24px', background: 'var(--ink)' }}>
                    <span style={{ fontSize: 24, display: 'block', marginBottom: 14 }}>{item.icon}</span>
                    <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 7px' }}>{item.label}</p>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#fff', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.value}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, x: 36 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            style={{ minHeight: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 44, border: '1px solid var(--line)' }}>
            <div style={{ width: 72, height: 72, background: 'var(--orange-soft)', border: '1px solid rgba(255,90,31,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📍</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 900, fontSize: 20, color: '#fff', margin: '0 0 10px' }}>Arry Production</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 500, margin: '0 0 28px', fontSize: 15 }}>Str. Muzicii nr. 1, București</p>
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="btn-outline solid">
                Deschide în Maps
              </a>
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .contact-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
