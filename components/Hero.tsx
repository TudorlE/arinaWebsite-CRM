'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { EASE, RevealLines } from '@/components/motionx';
import { openBooking } from '@/components/Booking';

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 64]);

  const go = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section ref={ref} id="acasa" style={{ position: 'relative', background: 'var(--bg)', paddingTop: 96 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', alignItems: 'stretch', minHeight: 'min(calc(100vh - 96px), 900px)' }} className="hero-grid">

        <motion.div className="hero-copy hero-copy-in" style={{ y: copyY, padding: '72px 44px 72px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span className="eyebrow" style={{ marginBottom: 30 }}>
            Școală de Muzică Premium · Chișinău
          </span>

          <RevealLines tag="h1"
            style={{ fontSize: 'clamp(34px, 6.4vw, 82px)', lineHeight: 1.12, letterSpacing: '-0.02em', textTransform: 'uppercase', fontWeight: 800, color: 'var(--tx)' }}
            lines={['Descoperă', 'lumea', 'creației']}
          />

          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sand)', margin: '22px 0 0' }}>
            cu Arry Production Studio
          </p>

          <p style={{ fontSize: 16, color: 'var(--tx-mut)', maxWidth: 440, margin: '26px 0 38px', lineHeight: 1.75 }}>
            Școala unde pasiunea pentru muzică devine performanță — de la primele
            note la concertul de vis. Pian, tobe, canto, chitară și solfegiu.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <button onClick={openBooking} className="btn-outline solid">Înscrie-te la o lecție de probă</button>
            <button onClick={() => go('#cursuri')} className="btn-outline">Vezi cursurile</button>
          </div>
        </motion.div>

        <motion.div
          initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
          className="ph-wrap hero-img"
          style={{ position: 'relative', overflow: 'hidden', borderLeft: '1px solid var(--line)', minHeight: 420 }}
        >
          <motion.img
            style={{ y: imgY, scale: imgScale, position: 'absolute', inset: '-10% 0', width: '100%', height: '120%', objectFit: 'cover' }}
            src="https://images.unsplash.com/photo-1520166012956-add9ba0835cb?w=1100&q=80&auto=format&fit=crop"
            alt="Pian sub lumină caldă"
            className="ph ph-red"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--bg) 0%, rgba(16,13,11,0.1) 22%, rgba(16,13,11,0) 45%)' }} />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.9 }}
            style={{
              position: 'absolute', left: 28, bottom: 28, padding: '18px 22px',
              background: 'rgba(16,13,11,0.62)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid var(--line-strong)', maxWidth: 280,
            }}>
            <p style={{ fontSize: 19, fontWeight: 800, color: 'var(--tx)', margin: 0, letterSpacing: '0.02em' }}>+373 60 081 991</p>
            <p style={{ fontSize: 11.5, color: 'var(--tx-mut)', margin: '6px 0 0', lineHeight: 1.5 }}>
              Sună-ne pentru o lecție de probă gratuită sau programează o vizită la studio.
            </p>
          </motion.div>

          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%) rotate(90deg)', transformOrigin: 'right center',
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.34em', textTransform: 'uppercase', color: 'rgba(242,237,230,0.55)',
          }}>
            Fotografii din studio
          </span>
        </motion.div>
      </div>

      <motion.button onClick={() => go('#despre')} aria-label="Derulează în jos"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
        style={{ position: 'absolute', left: 34, bottom: 26, width: 34, height: 34, border: '1px solid var(--line-strong)', background: 'none', color: 'var(--tx-mut)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        className="hide-mobile">
        <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'inline-flex' }}>
          <ArrowDown style={{ width: 14, height: 14 }} />
        </motion.span>
      </motion.button>

      <style>{`
        @keyframes heroCopyIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .hero-copy-in > :not(h1) { animation: heroCopyIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.05s backwards; }
        .hero-copy-in > :nth-child(3) { animation-delay: 0.12s; }
        .hero-copy-in > :nth-child(4) { animation-delay: 0.18s; }
        .hero-copy-in > :nth-child(5) { animation-delay: 0.24s; }
        @media (prefers-reduced-motion: reduce) { .hero-copy-in > * { animation: none !important; } }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; min-height: 0 !important; }
          .hero-copy { order: 2; padding: 40px 22px 60px !important; }
          .hero-img { order: 1; min-height: 300px !important; border-left: 0 !important; border-bottom: 1px solid var(--line) !important; }
        }
        @media (max-width: 380px) {
          .hero-copy h1 { font-size: 40px !important; }
        }
      `}</style>
    </section>
  );
}
