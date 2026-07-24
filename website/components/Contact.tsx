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
    <section id="contact" style={{ padding: '120px 24px', background: 'linear-gradient(180deg, #07040f 0%, #0b0618 50%, #07040f 100%)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 68 }}>
          <span style={{ display: 'inline-block', padding: '7px 18px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20, background: 'rgba(255,213,74,0.1)', color: '#FFD54A', border: '1px solid rgba(255,213,74,0.2)' }}>
            Contact
          </span>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 56px)', fontWeight: 900, color: '#fff', margin: '0 0 18px', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
            Ia legătura cu noi
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.42)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Suntem aici să răspundem oricărei întrebări. Nu ezita să ne contactezi!
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }} className="contact-grid">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {info.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                {item.href ? (
                  <a href={item.href}
                    style={{ display: 'block', padding: '28px 24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', transition: 'all 0.3s', textDecoration: 'none', backdropFilter: 'blur(8px)' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,213,74,0.35)'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.3), 0 0 24px rgba(255,213,74,0.08)'; el.style.background = 'rgba(255,213,74,0.05)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; el.style.background = 'rgba(255,255,255,0.03)'; }}>
                    <span style={{ fontSize: 28, display: 'block', marginBottom: 14 }}>{item.icon}</span>
                    <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 7px' }}>{item.label}</p>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#fff', margin: 0, lineHeight: 1.5 }}>{item.value}</p>
                  </a>
                ) : (
                  <div style={{ padding: '28px 24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: 28, display: 'block', marginBottom: 14 }}>{item.icon}</span>
                    <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 7px' }}>{item.label}</p>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#fff', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.value}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            style={{ borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(145deg, rgba(255,213,74,0.07), rgba(109,40,217,0.07))', minHeight: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 44, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: 84, height: 84, borderRadius: 24, background: 'linear-gradient(135deg, #C9A020, #FFD54A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, boxShadow: '0 8px 32px rgba(255,213,74,0.3)' }}>📍</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 900, fontSize: 22, color: '#fff', margin: '0 0 10px' }}>Arry Production</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 500, margin: '0 0 28px', fontSize: 15 }}>Str. Muzicii nr. 1, București</p>
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '13px 30px', borderRadius: 99, fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg, #C9A020, #FFD54A)', color: '#0d0a00', textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,213,74,0.3)', transition: 'all 0.22s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(255,213,74,0.5)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(255,213,74,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                Deschide în Maps →
              </a>
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .contact-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
