'use client';
import { motion } from 'framer-motion';

const vals = [
  { icon: '❤️', title: 'Pasiune autentică', desc: 'Fiecare profesor iubește muzica și transmite această dragoste elevilor.' },
  { icon: '⭐', title: 'Excelență artistică', desc: 'Metodă pedagogică modernă adaptată fiecărui elev, indiferent de nivel.' },
  { icon: '👥', title: 'Comunitate vibrantă', desc: 'O familie muzicală unită prin concerte, recitaluri și colaborări.' },
  { icon: '🏆', title: 'Rezultate dovedite', desc: 'Sute de elevi au descoperit muzica cu noi, mulți ajungând la performanță.' },
];

export default function About() {
  return (
    <section id="despre" style={{ padding: '120px 24px', background: 'linear-gradient(180deg, #0D0905 0%, #120B07 50%, #0D0905 100%)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="about-grid">

        {/* Image */}
        <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative' }}>
          {/* Glow behind */}
          <div style={{ position: 'absolute', inset: -24, background: 'radial-gradient(ellipse, rgba(244,168,92,0.12) 0%, transparent 70%)', borderRadius: 40, pointerEvents: 'none' }} />
          <div style={{ borderRadius: 28, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)', position: 'relative' }}>
            <img src="https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=85&fit=crop" alt="Lectie de muzica" style={{ width: '100%', height: 520, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,9,5,0.4) 0%, transparent 60%)' }} />
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
            style={{ position: 'absolute', bottom: -22, right: -22, background: 'rgba(14,9,5,0.92)', backdropFilter: 'blur(16px)', borderRadius: 18, padding: '18px 26px', boxShadow: '0 16px 48px rgba(0,0,0,0.4)', border: '1px solid rgba(244,168,92,0.2)' }}>
            <p style={{ fontSize: 38, fontWeight: 900, color: '#F4A85C', margin: 0, lineHeight: 1, textShadow: '0 0 24px rgba(244,168,92,0.4)' }}>10+</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 4, margin: 0 }}>Ani de experiență</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.55 }}
            style={{ position: 'absolute', top: -22, left: -22, background: 'rgba(14,9,5,0.92)', backdropFilter: 'blur(16px)', borderRadius: 18, padding: '18px 26px', boxShadow: '0 16px 48px rgba(0,0,0,0.4)', border: '1px solid rgba(244,168,92,0.2)' }}>
            <p style={{ fontSize: 38, fontWeight: 900, color: '#F4A85C', margin: 0, lineHeight: 1, textShadow: '0 0 24px rgba(244,168,92,0.4)' }}>300+</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 4, margin: 0 }}>Elevi fericiți</p>
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <span style={{ display: 'inline-block', padding: '7px 18px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 22, background: 'rgba(244,168,92,0.1)', color: '#F4A85C', border: '1px solid rgba(244,168,92,0.2)' }}>
            Despre noi
          </span>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 52px)', fontWeight: 900, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.025em', margin: '0 0 20px' }}>
            Despre <span style={{ color: '#F4A85C' }}>Arry Production</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.78, margin: '0 0 16px' }}>
            Arry Production este mai mult decât o școală de muzică — este un loc unde copiii, adolescenții și adulții descoperă bucuria de a cânta, de a crea și de a se exprima liber prin artă.
          </p>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.78, margin: '0 0 44px' }}>
            Profesorii noștri sunt artiști dedicați care adaptează fiecare lecție la personalitatea și ritmul fiecărui elev.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {vals.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ display: 'flex', gap: 14, padding: '16px', borderRadius: 16, transition: 'all 0.22s', cursor: 'default', border: '1px solid transparent' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(244,168,92,0.06)'; el.style.borderColor = 'rgba(244,168,92,0.15)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'transparent'; }}>
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{v.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', margin: '0 0 4px' }}>{v.title}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, margin: 0 }}>{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <style>{`@media (max-width: 900px) { .about-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
