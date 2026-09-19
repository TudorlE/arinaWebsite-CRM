'use client';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, ArrowUpRight } from 'lucide-react';
import { useLocale } from '@/lib/i18n';

const ease = [0.22, 1, 0.36, 1] as const;

// str. Burebista 76, Chișinău — https://maps.app.goo.gl/L1ptSto9aPxHWESM8
const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/L1ptSto9aPxHWESM8';
const infoHrefs = [GOOGLE_MAPS_URL, 'tel:+37360081991', 'mailto:contact@arryproduction.md', undefined];
const infoIcons = [MapPin, Phone, Mail, Clock];

// OpenStreetMap embed — no API key, no frame-busting. bbox around str. Burebista 76, Chișinău.
const MAP_SRC = 'https://www.openstreetmap.org/export/embed.html?bbox=28.8557%2C46.9718%2C28.8937%2C46.9903&layer=mapnik&marker=46.9811%2C28.8747';

export default function Contact() {
  const { t } = useLocale();
  const info = t.contact.info.map((it, i) => ({ ...it, href: infoHrefs[i], icon: infoIcons[i] }));

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <item.icon style={{ width: 20, height: 20, color: 'var(--sand)', strokeWidth: 1.4 }} />
                  {item.href && <ArrowUpRight className="contact-arrow" style={{ width: 15, height: 15, color: 'var(--tx-faint)' }} />}
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tx-faint)', margin: '20px 0 8px' }}>{item.label}</p>
                <p style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--tx)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.value}</p>
              </>
            );
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                whileHover={{ y: -5 }}
                className="contact-card"
                style={{ border: '1px solid var(--line)', padding: '26px 22px', position: 'relative', overflow: 'hidden' }}>
                <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, ease, delay: i * 0.06 + 0.1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)', transformOrigin: '0%' }} />
                {item.href
                  ? <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined} style={{ display: 'block' }}>{inner}</a>
                  : inner}
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
        className="map-panel"
        style={{ marginTop: 64, borderTop: '1px solid var(--line)', height: 460, position: 'relative', overflow: 'hidden', background: 'var(--bg-alt)' }}
      >
        <iframe
          title={t.contact.mapTitle}
          src={MAP_SRC}
          sandbox="allow-scripts allow-same-origin allow-popups"
          style={{ width: '100%', height: '100%', border: 0, pointerEvents: 'none' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="map-veil" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(16,13,11,0.05) 0%, rgba(16,13,11,0.32) 100%)' }} />
        <span className="map-pulse" />
        {/* Full-panel link overlay (the iframe itself has pointer-events: none) */}
        <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" aria-label={t.contact.mapCta} style={{ position: 'absolute', inset: 0 }}>
          <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease }}
            style={{ position: 'absolute', left: 32, top: 28, padding: '18px 22px', background: 'rgba(16,13,11,0.8)', backdropFilter: 'blur(10px)', border: '1px solid var(--line-strong)' }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#F2EDE6', margin: '0 0 6px' }}>Arry Studio</p>
            <p style={{ fontSize: 12, color: 'rgba(242,237,230,0.72)', margin: 0 }}>{t.contact.mapCaption}</p>
          </motion.div>
          <span className="map-cta">
            {t.contact.mapCta} <ArrowUpRight style={{ width: 14, height: 14 }} />
          </span>
        </a>
      </motion.div>

      <style>{`
        .contact-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .contact-card { transition: border-color 0.3s ease; }
        .contact-card:hover { border-color: var(--sand-deep); }
        .contact-card .contact-arrow { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        .contact-card:hover .contact-arrow { transform: translate(3px, -3px); color: var(--sand); }
        .map-panel { transition: box-shadow 0.4s ease; }
        .map-panel:hover .map-veil { background: linear-gradient(180deg, rgba(16,13,11,0.02) 0%, rgba(16,13,11,0.18) 100%) !important; }
        .map-cta {
          position: absolute; right: 32px; bottom: 28px;
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
          background: rgba(16,13,11,0.8); backdrop-filter: blur(10px); border: 1px solid var(--line-strong); color: #F2EDE6;
          transition: background-color 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .map-panel:hover .map-cta { background: var(--paper); color: var(--sand-ink); transform: translateY(-2px); }
        @media (max-width: 780px) { .contact-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 440px) { .contact-grid { grid-template-columns: 1fr; } .map-cta { left: 32px; right: 32px; justify-content: center; } }
      `}</style>
    </section>
  );
}
