'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { EASE, RevealLines } from '@/components/motionx';
import { openBooking } from '@/components/Booking';
import { useLocale } from '@/lib/i18n';

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 64]);
  const { t } = useLocale();
  const h = t.hero;

  const go = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section ref={ref} id="acasa" className="hero-section" style={{ position: 'relative', background: 'var(--bg)', paddingTop: 96, overflow: 'hidden', minHeight: 'min(calc(100vh), 900px)', display: 'flex', flexDirection: 'column' }}>

      {/* Full-bleed background photo — spans the entire hero section, not just a side column */}
      <motion.div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} className="hero-img">
        <motion.img
          style={{ scale: imgScale, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
          src="/hero-arry.jpg"
          alt={h.imgAlt}
          className="ph"
        />
        <div className="hero-scrim" style={{ position: 'absolute', inset: 0 }} />
      </motion.div>

      <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', width: '100%', flex: 1, display: 'flex' }} className="hero-grid">

        <motion.div className="hero-copy hero-copy-in" style={{ y: copyY, padding: '72px 44px 72px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 640 }}>
          <span className="eyebrow" style={{ marginBottom: 30 }}>
            {h.eyebrow}
          </span>

          <RevealLines tag="h1"
            style={{ fontSize: 'clamp(34px, 6.4vw, 82px)', lineHeight: 1.12, letterSpacing: '-0.02em', textTransform: 'uppercase', fontWeight: 800, color: 'var(--tx)' }}
            lines={h.lines}
          />

          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sand)', margin: '22px 0 0' }}>
            {h.kicker}
          </p>

          <p style={{ fontSize: 16, color: 'var(--tx-mut)', maxWidth: 440, margin: '26px 0 38px', lineHeight: 1.75 }}>
            {h.desc}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <button onClick={openBooking} className="btn-outline solid" style={{ minWidth: 'min(340px, 100%)' }}>{h.ctaBook}</button>
            <button onClick={() => go('#cursuri')} className="btn-outline" style={{ minWidth: 'min(216px, 100%)' }}>{h.ctaCourses}</button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.9 }}
          className="hero-phone"
          style={{
            position: 'absolute', right: 32, bottom: 40, padding: '18px 22px',
            background: 'rgba(16,13,11,0.62)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid var(--line-strong)', maxWidth: 280,
          }}>
          <p style={{ fontSize: 19, fontWeight: 800, color: '#F2EDE6', margin: 0, letterSpacing: '0.02em' }}>+373 60 081 991</p>
          <p style={{ fontSize: 11.5, color: 'rgba(242,237,230,0.72)', margin: '6px 0 0', lineHeight: 1.5 }}>
            {h.phoneNote}
          </p>
        </motion.div>

        <span className="hero-photo-label" style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%) rotate(90deg)', transformOrigin: 'right center',
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.34em', textTransform: 'uppercase', color: 'rgba(242,237,230,0.55)',
        }}>
          {h.photoLabel}
        </span>
      </div>

      <style>{`
        .hero-scrim {
          background: linear-gradient(90deg, var(--bg) 0%, var(--bg) 8%, rgba(16,13,11,0.55) 32%, rgba(16,13,11,0.08) 58%, rgba(16,13,11,0) 75%);
        }
        @keyframes heroCopyIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .hero-copy-in > :not(h1) { animation: heroCopyIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.05s backwards; }
        .hero-copy-in > :nth-child(3) { animation-delay: 0.12s; }
        .hero-copy-in > :nth-child(4) { animation-delay: 0.18s; }
        .hero-copy-in > :nth-child(5) { animation-delay: 0.24s; }
        @media (prefers-reduced-motion: reduce) { .hero-copy-in > * { animation: none !important; } }
        @media (max-width: 900px) {
          .hero-section { min-height: 0 !important; }
          .hero-grid { display: block !important; padding-bottom: 40px; }
          .hero-copy { max-width: none !important; padding: 40px 22px 30px !important; }
          .hero-scrim { background: linear-gradient(180deg, var(--bg) 0%, var(--bg) 34%, rgba(16,13,11,0.5) 55%, rgba(16,13,11,0.15) 75%, rgba(16,13,11,0) 100%) !important; }
          .hero-phone { position: static !important; margin: 0 22px 24px !important; max-width: none !important; }
          .hero-photo-label { display: none; }
        }
        @media (max-width: 380px) {
          .hero-copy h1 { font-size: 40px !important; }
        }
      `}</style>
    </section>
  );
}
