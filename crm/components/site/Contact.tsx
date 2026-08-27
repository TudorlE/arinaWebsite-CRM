'use client';
import { motion } from 'framer-motion';
import { BLACK, OFFWHITE, LIME, HAIRLINE_ON_WHITE, display, body } from './theme';

const info = [
  { label: 'Telefon', value: '+40 700 000 000', href: 'tel:+40700000000' },
  { label: 'Email', value: 'contact@arryproduction.ro', href: 'mailto:contact@arryproduction.ro' },
  { label: 'Adresă', value: 'Strada Burebista 76, Chișinău' },
  { label: 'Program', value: 'Lun–Vin: 10:00–20:00\nSâmbătă: 10:00–16:00' },
];

export default function Contact() {
  return (
    <section id="contact" style={{ padding: '120px 24px', background: OFFWHITE }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 72, alignItems: 'start' }} className="contact-grid">

        {/* Left label */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: body, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20, color: BLACK }}>
            <span style={{ width: 24, height: 1, background: BLACK, display: 'inline-block' }} /> Contact
          </span>
          <h2 style={{ fontFamily: display, fontSize: 'clamp(40px, 6vw, 80px)', color: BLACK, margin: '0 0 20px', lineHeight: 0.9, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
            Ia legătura
          </h2>
          <p style={{ fontFamily: body, fontSize: 16, color: 'rgba(2,7,7,0.55)', maxWidth: 340, margin: 0, lineHeight: 1.6 }}>
            Suntem aici să răspundem oricărei întrebări. Nu ezita să ne contactezi!
          </p>
        </motion.div>

        {/* Right: info grid + map card */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${HAIRLINE_ON_WHITE}`, marginBottom: 40 }}>
            {info.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ borderBottom: `1px solid ${HAIRLINE_ON_WHITE}`, borderRight: i % 2 === 0 ? `1px solid ${HAIRLINE_ON_WHITE}` : 'none', padding: '26px 20px 26px 0' }}>
                <p style={{ fontFamily: body, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(2,7,7,0.4)', margin: '0 0 8px' }}>{item.label}</p>
                {item.href ? (
                  <a href={item.href} style={{ fontFamily: body, fontWeight: 700, fontSize: 15, color: BLACK, textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#5A6E00'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = BLACK; }}>{item.value}</a>
                ) : (
                  <p style={{ fontFamily: body, fontWeight: 700, fontSize: 15, color: BLACK, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.value}</p>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            style={{ background: BLACK, padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontFamily: display, fontSize: 22, color: OFFWHITE, margin: '0 0 8px', textTransform: 'uppercase' }}>Arry Production</p>
              <p style={{ fontFamily: body, color: 'rgba(244,243,237,0.5)', fontWeight: 500, margin: 0, fontSize: 14 }}>Strada Burebista 76, Chișinău</p>
            </div>
            <a href="https://maps.app.goo.gl/yaQVySeQyTb18c9B6" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '14px 26px', fontWeight: 700, fontSize: 13, background: LIME, color: BLACK, textDecoration: 'none', transition: 'all 0.2s', fontFamily: body, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = OFFWHITE; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = LIME; }}>
              Deschide în Maps →
            </a>
          </motion.div>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .contact-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
