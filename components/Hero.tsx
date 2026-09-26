'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Phone } from 'lucide-react';
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
        <div className="hero-nav-scrim" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 130 }} />
      </motion.div>

      <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', width: '100%', flex: 1, display: 'flex', justifyContent: 'center' }} className="hero-grid">

        <motion.div className="hero-copy hero-copy-in" style={{ y: copyY, padding: '72px 44px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 760, textAlign: 'center' }}>
          <span className="eyebrow" style={{ marginBottom: 30 }}>
            {h.eyebrow}
          </span>

          <RevealLines tag="h1"
            style={{ fontSize: 'clamp(34px, 6.4vw, 82px)', lineHeight: 1.12, letterSpacing: '-0.02em', textTransform: 'uppercase', fontWeight: 800, color: 'var(--tx)', textAlign: 'center' }}
            lines={h.lines}
          />

          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sand)', margin: '22px 0 0' }}>
            {h.kicker}
          </p>

          <p style={{ fontSize: 16, color: 'var(--tx-mut)', maxWidth: 440, margin: '26px auto 38px', lineHeight: 1.75 }}>
            {h.desc}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
            <button onClick={openBooking} className="btn-outline solid" style={{ minWidth: 'min(340px, 100%)' }}>{h.ctaBook}</button>
            <button onClick={() => go('#cursuri')} className="btn-outline" style={{ minWidth: 'min(216px, 100%)' }}>{h.ctaCourses}</button>
          </div>
        </motion.div>

        <motion.a href="tel:+37360081991"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.9 }}
          whileHover={{ y: -3, borderColor: 'var(--accent)' }}
          className="hero-phone"
          style={{
            position: 'absolute', right: 32, bottom: 40, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px 16px 16px',
            background: 'rgba(16,13,11,0.66)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid var(--line-strong)', maxWidth: 310, textDecoration: 'none', cursor: 'pointer',
          }}>
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, flexShrink: 0,
            border: '1px solid var(--accent)', color: 'var(--accent)', background: 'rgba(216,184,146,0.14)',
          }}>
            <Phone style={{ width: 19, height: 19 }} />
          </span>
          <div>
            <p style={{ fontSize: 19, fontWeight: 800, color: '#F2EDE6', margin: 0, letterSpacing: '0.02em' }}>+373 60 081 991</p>
            <p style={{ fontSize: 11.5, color: 'rgba(242,237,230,0.72)', margin: '4px 0 0', lineHeight: 1.45 }}>
              {h.phoneNote}
            </p>
          </div>
        </motion.a>
      </div>

      <style>{`
        .hero-scrim {
          background:
            radial-gradient(ellipse 60% 55% at 50% 42%, rgba(16,13,11,0.6) 0%, rgba(16,13,11,0.28) 60%, rgba(16,13,11,0) 100%),
            linear-gradient(180deg, rgba(16,13,11,0.15) 0%, rgba(16,13,11,0.1) 50%, rgba(16,13,11,0.45) 100%);
        }
        .hero-copy .eyebrow, .hero-copy h1, .hero-copy p {
          text-shadow: 0 2px 20px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6);
        }
        .hero-nav-scrim {
          background: linear-gradient(180deg, rgba(16,13,11,0.78) 0%, rgba(16,13,11,0.4) 55%, rgba(16,13,11,0) 100%);
          pointer-events: none;
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
        }
        @media (max-width: 380px) {
          .hero-copy h1 { font-size: 40px !important; }
        }
      `}</style>
    </section>
  );
}
