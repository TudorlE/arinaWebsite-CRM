'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Reveal, RevealLines, Parallax, EASE } from '@/components/motionx';

// Pune fotografia Arinei la public/arina.jpg (portret vertical).
const ARINA_PHOTO = '/arina.jpg';
const FALLBACK = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&q=85&auto=format&fit=crop&crop=face';

export default function Founder() {
  const [src, setSrc] = useState(ARINA_PHOTO);
  return (
    <section id="fondator" style={{ padding: 'clamp(64px, 9vh, 104px) 32px', background: 'var(--bg-alt)' }}>
      <hr className="rule" style={{ maxWidth: 1240, margin: '0 auto 54px' }} />
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: 72, alignItems: 'center' }} className="founder-grid">

        {/* Image */}
        <motion.div initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }} whileInView={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: EASE }}
          className="ph-wrap" style={{ position: 'relative', overflow: 'hidden', border: '1px solid var(--line)' }}>
          <Parallax distance={28} style={{ height: 560 }}>
            <img src={src} alt="Arina Bădulescu, fondatoarea Arry Studio" className="ph"
              onError={() => setSrc(FALLBACK)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 28%', display: 'block' }} />
          </Parallax>
          <span style={{ position: 'absolute', left: 18, bottom: 16, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(242,237,230,0.7)', zIndex: 2 }}>Arina Bădulescu</span>
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: EASE }}>
          <Reveal><span className="eyebrow" style={{ marginBottom: 22, display: 'inline-flex' }}>05 — Fondatoarea școlii</span></Reveal>
          <RevealLines tag="h2" style={{ fontSize: 'clamp(40px, 5vw, 70px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em', textTransform: 'uppercase', marginTop: 18, marginBottom: 34 }}
            lines={['Arina', <span key="b" style={{ color: 'var(--sand)' }}>Bădulescu</span>]} />

          <p style={{ fontSize: 15, color: 'var(--tx-mut)', lineHeight: 1.85, margin: '0 0 16px' }}>
            Arina a crescut înconjurată de muzică. De la primele lecții de pian la
            vârsta de 5 ani și până la studii superioare la Conservator, muzica a
            fost întotdeauna centrul vieții sale.
          </p>
          <p style={{ fontSize: 15, color: 'var(--tx-mut)', lineHeight: 1.85, margin: '0 0 16px' }}>
            Arry Production s-a născut din dorința de a crea un spațiu în care
            fiecare copil și adult să aibă ocazia să-și descopere și să-și dezvolte
            talentul muzical.
          </p>
          <p style={{ fontSize: 15, color: 'var(--tx-mut)', lineHeight: 1.85, margin: '0 0 40px' }}>
            Cu peste un deceniu de experiență în educație muzicală, Arina a
            construit o echipă de profesori pasionați care cred că muzica este un
            drept al oricărei ființe umane.
          </p>

          <blockquote style={{ borderLeft: '2px solid var(--orange)', paddingLeft: 24, margin: 0 }}>
            <p style={{ fontSize: 18, color: 'var(--tx)', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 16px', fontFamily: 'var(--font-playfair), serif' }}>
              „Cred că fiecare copil are un talent care merită descoperit. Muzica
              este cheia care deschide uși pe care nici nu știai că există.”
            </p>
            <p style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--tx)', margin: '0 0 3px' }}>Arina Bădulescu</p>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sand-deep)', margin: 0 }}>Fondatoare &amp; Director Artistic</p>
          </blockquote>
        </motion.div>
      </div>
      <style>{`
        @media (max-width: 900px) { .founder-grid { grid-template-columns: 1fr !important; gap: 44px !important; } }
      `}</style>
    </section>
  );
}
