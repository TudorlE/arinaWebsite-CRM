'use client';
import { motion } from 'framer-motion';
import { BLACK, OFFWHITE, LIME, body } from './theme';

export default function Hero() {
  const go = (id: string) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="acasa" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: BLACK }}>

      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=85&fit=crop')`,
        backgroundSize: 'cover', backgroundPosition: 'center 30%',
        filter: 'grayscale(0.55) contrast(1.15) brightness(0.65)',
      }} />

      {/* Overlay: strong black grade, vignette toward center for text legibility */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(2,7,7,0.78) 0%, rgba(2,7,7,0.6) 45%, rgba(2,7,7,0.92) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(180deg, rgba(2,7,7,0.4) 0%, transparent 20%, transparent 75%, rgba(2,7,7,0.85) 100%)' }} />

      {/* Content — centered */}
      <div style={{ position: 'relative', zIndex: 3, width: '100%', maxWidth: 980, margin: '0 auto', padding: '120px 32px 100px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Badge flanked by thin lines */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <span style={{ width: 40, height: 1, background: 'rgba(244,243,237,0.35)', display: 'inline-block' }} />
          <span style={{ fontFamily: body, fontSize: 11, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: OFFWHITE, opacity: 0.75, whiteSpace: 'nowrap' }}>
            Școală de Muzică Premium — Est. 2016
          </span>
          <span style={{ width: 40, height: 1, background: 'rgba(244,243,237,0.35)', display: 'inline-block' }} />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{
            fontFamily: 'var(--font-anton), sans-serif', fontSize: 'clamp(52px, 10vw, 148px)', color: OFFWHITE, lineHeight: 0.88,
            letterSpacing: '-0.01em', margin: '0 0 36px', textTransform: 'uppercase',
          }}>
          Descoperă<br />
          <span style={{ color: LIME }}>talentul</span><br />
          muzical.
        </motion.h1>

        {/* Thin rule under headline */}
        <motion.span initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
          style={{ width: 64, height: 2, background: LIME, display: 'block', marginBottom: 32 }} />

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}
          style={{ fontFamily: body, fontSize: 18, color: 'rgba(244,243,237,0.65)', maxWidth: 480, margin: '0 0 48px', lineHeight: 1.6, fontWeight: 400 }}>
          Școala unde pasiunea pentru muzică devine performanță — de la primele note la concertul de vis.
        </motion.p>

        {/* CTA buttons */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => go('#inscriere')}
            style={{ padding: '18px 36px', fontSize: 13, fontWeight: 700, background: LIME, color: BLACK, transition: 'all 0.2s', border: 'none', cursor: 'pointer', fontFamily: body, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = OFFWHITE; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = LIME; }}>
            Înscrie-te acum →
          </button>
          <button onClick={() => go('#cursuri')}
            style={{ padding: '18px 34px', fontSize: 13, fontWeight: 700, color: OFFWHITE, border: '1px solid rgba(244,243,237,0.3)', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s', fontFamily: body, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = LIME; (e.currentTarget as HTMLElement).style.color = LIME; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,243,237,0.3)'; (e.currentTarget as HTMLElement).style.color = OFFWHITE; }}>
            Vezi cursurile
          </button>
        </motion.div>
      </div>

      {/* Scroll cue — centered at bottom */}
      <motion.button onClick={() => go('#despre')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'rgba(244,243,237,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: body }}>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Scroll</span>
        <div className="bounce-y" style={{ width: 1, height: 32, background: `linear-gradient(to bottom, ${LIME}, transparent)` }} />
      </motion.button>
    </section>
  );
}
