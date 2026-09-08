'use client';
import { motion } from 'framer-motion';
import { useLocale } from '@/lib/i18n';

const ease = [0.22, 1, 0.36, 1] as const;

const infoHrefs = [undefined, 'tel:+37360081991', 'mailto:contact@arryproduction.md', undefined];

// OpenStreetMap embed — no API key, no frame-busting. bbox around central Chișinău.
const MAP_SRC = 'https://www.openstreetmap.org/export/embed.html?bbox=28.8180%2C47.0155%2C28.8560%2C47.0340&layer=mapnik&marker=47.0245%2C28.8353';

export default function Contact() {
  const { t } = useLocale();
  const info = t.contact.info.map((it, i) => ({ ...it, href: infoHrefs[i] }));

  return (
    <section id="contact" style={{ padding: 'clamp(64px, 9vh, 104px) 0 0', background: 'var(--bg)' }}>
      <hr className="rule" style={{ maxWidth: 1240, margin: '0 auto 70px', width: 'calc(100% - 64px)' }} />
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease }} style={{ marginBottom: 48 }}>
          <span className="eyebrow" style={{ marginBottom: 22 }}>{t.contact.eyebrow}</span>
          <h2 style={{ fontSize: 'clamp(30px, 3.6vw, 50px)', fontWeight: 800, color: 'var(--tx)', margin: '16px 0 0', lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            {t.contact.title}
          </h2>
        </motion.div>

        <div className="contact-grid">
          {info.map((item, i) => {
            const inner = (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tx-faint)', margin: '0 0 10px' }}>{item.label}</p>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.value}</p>
              </>
            );
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, borderColor: 'var(--sand-deep)' }}
                style={{ borderTop: '1px solid var(--line-strong)', paddingTop: 22 }}>
                {item.href
                  ? <a href={item.href} className="link-cta" style={{ display: 'block', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>{inner}</a>
                  : inner}
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
        style={{ marginTop: 64, borderTop: '1px solid var(--line)', height: 420, position: 'relative', overflow: 'hidden', background: 'var(--bg-alt)' }}>
        <iframe
          title={t.contact.mapTitle}
          src={MAP_SRC}
          sandbox="allow-scripts allow-same-origin allow-popups"
          style={{ width: '100%', height: '100%', border: 0, filter: 'grayscale(0.9) invert(0.92) contrast(0.85) hue-rotate(180deg)' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <span className="map-pulse" />
        <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease }}
          style={{ position: 'absolute', left: 32, top: 28, padding: '16px 20px', background: 'rgba(16,13,11,0.78)', backdropFilter: 'blur(8px)', border: '1px solid var(--line-strong)' }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: '#F2EDE6', margin: '0 0 6px' }}>Arry Studio</p>
          <p style={{ fontSize: 12, color: 'rgba(242,237,230,0.72)', margin: 0 }}>{t.contact.mapCaption}</p>
        </motion.div>
      </motion.div>

      <style>{`
        .contact-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; }
        @media (max-width: 780px) { .contact-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 440px) { .contact-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
