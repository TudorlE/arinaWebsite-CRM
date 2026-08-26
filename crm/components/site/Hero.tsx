'use client';
import { motion } from 'framer-motion';

const NOTES = [
  { n: '♪', x: '5%',  y: '16%', s: 3.6, cls: 'fa', delay: '0s' },
  { n: '♫', x: '15%', y: '62%', s: 2.8, cls: 'fb', delay: '1s' },
  { n: '♩', x: '27%', y: '10%', s: 4.2, cls: 'fc', delay: '0.5s' },
  { n: '♬', x: '73%', y: '20%', s: 3.0, cls: 'fa', delay: '1.5s' },
  { n: '♭', x: '87%', y: '58%', s: 2.4, cls: 'fb', delay: '0.8s' },
  { n: '♮', x: '54%', y: '80%', s: 2.8, cls: 'fc', delay: '2s' },
  { n: '♩', x: '92%', y: '30%', s: 3.8, cls: 'fa', delay: '0.3s' },
  { n: '♪', x: '41%', y: '7%',  s: 2.2, cls: 'fb', delay: '1.2s' },
  { n: '♫', x: '63%', y: '52%', s: 3.2, cls: 'fc', delay: '0.7s' },
  { n: '♬', x: '8%',  y: '82%', s: 2.0, cls: 'fa', delay: '1.8s' },
];

export default function Hero() {
  const go = (id: string) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="acasa" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#0D0905' }}>

      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=85&fit=crop')`,
        backgroundSize: 'cover', backgroundPosition: 'center 30%',
      }} />

      {/* Main overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(160deg, rgba(11,7,4,0.92) 0%, rgba(17,11,6,0.78) 45%, rgba(11,6,4,0.88) 100%)' }} />
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse at center, transparent 35%, rgba(6,4,2,0.65) 100%)' }} />
      {/* Purple glow — bottom left */}
      <div style={{ position: 'absolute', bottom: '-8%', left: '-4%', width: '55%', height: '60%', zIndex: 1, background: 'radial-gradient(ellipse, rgba(156,74,30,0.18) 0%, transparent 68%)', pointerEvents: 'none' }} />
      {/* Gold glow — top right */}
      <div style={{ position: 'absolute', top: '-4%', right: '4%', width: '45%', height: '55%', zIndex: 1, background: 'radial-gradient(ellipse, rgba(244,168,92,0.07) 0%, transparent 68%)', pointerEvents: 'none' }} />

      {/* Floating notes */}
      {NOTES.map((note, i) => (
        <span key={i} className={note.cls}
          style={{ position: 'absolute', zIndex: 2, userSelect: 'none', pointerEvents: 'none', left: note.x, top: note.y, fontSize: `${note.s}rem`, color: `rgba(244,168,92,0.16)`, fontWeight: 700, animationDelay: note.delay, filter: 'drop-shadow(0 0 10px rgba(244,168,92,0.35))' }}>
          {note.n}
        </span>
      ))}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 24px', width: '100%', maxWidth: 1040, margin: '0 auto', paddingTop: 88 }}>
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>

          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.65 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '9px 24px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 38, background: 'rgba(244,168,92,0.08)', color: '#F2C89A', border: '1px solid rgba(244,168,92,0.22)', backdropFilter: 'blur(10px)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F4A85C', display: 'inline-block', animation: 'glowDot 2s ease-in-out infinite' }} />
            Școală de Muzică Premium
          </motion.span>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(44px, 8vw, 98px)', fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 28px', textShadow: '0 4px 60px rgba(0,0,0,0.4)' }}>
            Descoperă<br />
            <span style={{ color: '#F4A85C' }}>talentul muzical</span><br />
            din tine.
          </h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }}
            style={{ fontSize: 20, color: 'rgba(255,255,255,0.58)', maxWidth: 560, margin: '0 auto 54px', lineHeight: 1.78, fontWeight: 400 }}>
            Școala unde pasiunea pentru muzică devine performanță — de la primele note la concertul de vis.
          </motion.p>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.7 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => go('#inscriere')}
              style={{ padding: '17px 40px', borderRadius: 16, fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg, #E08A3C, #F4A85C, #F7C98A)', color: '#0d0a00', boxShadow: '0 8px 32px rgba(244,168,92,0.45), 0 0 0 1px rgba(244,168,92,0.25)', transition: 'all 0.25s', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { const el = e.target as HTMLElement; el.style.transform = 'scale(1.05) translateY(-2px)'; el.style.boxShadow = '0 16px 48px rgba(244,168,92,0.6)'; }}
              onMouseLeave={e => { const el = e.target as HTMLElement; el.style.transform = 'scale(1)'; el.style.boxShadow = '0 8px 32px rgba(244,168,92,0.45), 0 0 0 1px rgba(244,168,92,0.25)'; }}>
              Înscrie-te acum ✦
            </button>
            <button onClick={() => go('#cursuri')}
              style={{ padding: '17px 38px', borderRadius: 16, fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.25s' }}
              onMouseEnter={e => { const el = e.target as HTMLElement; el.style.background = 'rgba(255,255,255,0.12)'; el.style.borderColor = 'rgba(255,255,255,0.4)'; }}
              onMouseLeave={e => { const el = e.target as HTMLElement; el.style.background = 'rgba(255,255,255,0.05)'; el.style.borderColor = 'rgba(255,255,255,0.18)'; }}>
              Descoperă cursurile →
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.button onClick={() => go('#despre')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          style={{ position: 'absolute', bottom: -110, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.32)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Explorează</span>
          <div className="bounce-y" style={{ width: 1, height: 44, background: 'linear-gradient(to bottom, rgba(244,168,92,0.55), transparent)', borderRadius: 1 }} />
        </motion.button>
      </div>

      {/* Animated waveform at bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, height: 90, overflow: 'hidden', pointerEvents: 'none' }}>
        <svg style={{ width: '200%', height: '100%', display: 'block', animation: 'waveScroll 12s linear infinite' }} viewBox="0 0 2880 90" preserveAspectRatio="none">
          <path d="M0,45 C80,18 160,72 240,45 C320,18 400,72 480,45 C560,18 640,72 720,45 C800,18 880,72 960,45 C1040,18 1120,72 1200,45 C1280,18 1360,72 1440,45 C1520,18 1600,72 1680,45 C1760,18 1840,72 1920,45 C2000,18 2080,72 2160,45 C2240,18 2320,72 2400,45 C2480,18 2560,72 2640,45 C2720,18 2800,72 2880,45"
            fill="none" stroke="rgba(244,168,92,0.22)" strokeWidth="1.5"/>
          <path d="M0,60 C100,35 200,80 300,60 C400,35 500,80 600,60 C700,35 800,80 900,60 C1000,35 1100,80 1200,60 C1300,35 1400,80 1500,60 C1600,35 1700,80 1800,60 C1900,35 2000,80 2100,60 C2200,35 2300,80 2400,60 C2500,35 2600,80 2700,60 C2800,35 2900,80 2880,60"
            fill="none" stroke="rgba(156,74,30,0.18)" strokeWidth="1.2"/>
        </svg>
      </div>
    </section>
  );
}
