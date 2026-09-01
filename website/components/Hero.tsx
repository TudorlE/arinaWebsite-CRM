'use client';
import { motion } from 'framer-motion';

export default function Hero() {
  const go = (id: string) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="acasa" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--ink)' }}>

      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=85&fit=crop')`,
        backgroundSize: 'cover', backgroundPosition: 'center 30%',
      }} />

      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(160deg, rgba(10,10,11,0.94) 0%, rgba(10,10,11,0.82) 45%, rgba(10,10,11,0.92) 100%)' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 24px', width: '100%', maxWidth: 1040, margin: '0 auto', paddingTop: 88 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>

          {/* Badge */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="eyebrow"
            style={{ marginBottom: 38, justifyContent: 'center' }}>
            <span style={{ width: 5, height: 5, background: 'var(--orange)', display: 'inline-block' }} />
            Școală de Muzică Premium
          </motion.span>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(44px, 8vw, 98px)', fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '20px 0 28px' }}>
            Descoperă<br />
            <span style={{ color: 'var(--orange)' }}>talentul muzical</span><br />
            din tine.
          </h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto 54px', lineHeight: 1.78, fontWeight: 400 }}>
            Școala unde pasiunea pentru muzică devine performanță — de la primele note la concertul de vis.
          </motion.p>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => go('#inscriere')} className="btn-outline solid">
              Înscrie-te acum
            </button>
            <button onClick={() => go('#cursuri')} className="btn-outline">
              Descoperă cursurile
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.button onClick={() => go('#despre')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
          style={{ position: 'absolute', bottom: -110, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Explorează</span>
          <div className="bounce-y" style={{ width: 1, height: 44, background: 'linear-gradient(to bottom, var(--orange), transparent)' }} />
        </motion.button>
      </div>
    </section>
  );
}
