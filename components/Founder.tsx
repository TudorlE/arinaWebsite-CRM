'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Reveal, RevealLines, Parallax, EASE } from '@/components/motionx';
import { useLocale } from '@/lib/i18n';

// Pune fotografia Arinei la public/arina.jpg (portret vertical).
const ARINA_PHOTO = '/arina.jpg';
const FALLBACK = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&q=85&auto=format&fit=crop&crop=face';

export default function Founder() {
  const [src, setSrc] = useState(ARINA_PHOTO);
  const { t } = useLocale();
  const f = t.founder;
  return (
    <section id="fondator" style={{ padding: 'clamp(64px, 9vh, 104px) 32px', background: 'var(--bg-alt)' }}>
      <hr className="rule" style={{ maxWidth: 1240, margin: '0 auto 54px' }} />
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: 72, alignItems: 'center' }} className="founder-grid">

        {/* Image */}
        <motion.div initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }} whileInView={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: EASE }}
          className="ph-wrap" style={{ position: 'relative', overflow: 'hidden', border: '1px solid var(--line)' }}>
          <Parallax distance={28} style={{ height: 560 }}>
            <img src={src} alt={f.imgAlt} className="ph"
              onError={() => setSrc(FALLBACK)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 28%', display: 'block' }} />
          </Parallax>
          <span style={{ position: 'absolute', left: 18, bottom: 16, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(242,237,230,0.7)', zIndex: 2 }}>{f.firstName} {f.lastName}</span>
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: EASE }}>
          <Reveal><span className="eyebrow" style={{ marginBottom: 22, display: 'inline-flex' }}>{f.eyebrow}</span></Reveal>
          <RevealLines tag="h2" style={{ fontSize: 'clamp(40px, 5vw, 70px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em', textTransform: 'uppercase', marginTop: 18, marginBottom: 34 }}
            lines={[f.firstName, <span key="b" style={{ color: 'var(--sand)' }}>{f.lastName}</span>]} />

          {f.paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 15, color: 'var(--tx-mut)', lineHeight: 1.85, margin: i === f.paragraphs.length - 1 ? '0 0 40px' : '0 0 16px' }}>
              {p}
            </p>
          ))}

          <blockquote style={{ borderLeft: '2px solid var(--orange)', paddingLeft: 24, margin: 0 }}>
            <p style={{ fontSize: 18, color: 'var(--tx)', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 16px', fontFamily: 'var(--font-playfair), serif' }}>
              „{f.quote}”
            </p>
            <p style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--tx)', margin: '0 0 3px' }}>{f.firstName} {f.lastName}</p>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sand-deep)', margin: 0 }}>{f.quoteRole}</p>
          </blockquote>
        </motion.div>
      </div>
      <style>{`
        @media (max-width: 900px) { .founder-grid { grid-template-columns: 1fr !important; gap: 44px !important; } }
      `}</style>
    </section>
  );
}
