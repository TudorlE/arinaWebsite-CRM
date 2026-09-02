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
    <section id="despre" style={{ padding: '120px 24px', background: 'var(--ink)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="about-grid">

        {/* Image */}
        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative' }}>
          <div style={{ overflow: 'hidden', border: '1px solid var(--line)', position: 'relative' }} className="img-hover-zoom">
            <img src="https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=85&fit=crop" alt="Lectie de muzica" style={{ width: '100%', height: 520, objectFit: 'cover', display: 'block', transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.35 }}
            style={{ position: 'absolute', bottom: -1, right: -1, background: 'var(--ink)', padding: '18px 26px', border: '1px solid var(--line)' }}>
            <p style={{ fontSize: 34, fontWeight: 900, color: 'var(--orange)', margin: 0, lineHeight: 1 }}>10+</p>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 6, margin: 0 }}>Ani de experiență</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
            style={{ position: 'absolute', top: -1, left: -1, background: 'var(--ink)', padding: '18px 26px', border: '1px solid var(--line)' }}>
            <p style={{ fontSize: 34, fontWeight: 900, color: 'var(--orange)', margin: 0, lineHeight: 1 }}>300+</p>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 6, margin: 0 }}>Elevi fericiți</p>
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <span className="eyebrow" style={{ marginBottom: 22 }}>Despre noi</span>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 52px)', fontWeight: 900, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.025em', margin: '18px 0 20px' }}>
            Despre <span style={{ color: 'var(--orange)' }}>Arry Production</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.78, margin: '0 0 16px' }}>
            Arry Production este mai mult decât o școală de muzică — este un loc unde copiii, adolescenții și adulții descoperă bucuria de a cânta, de a crea și de a se exprima liber prin artă.
          </p>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.78, margin: '0 0 44px' }}>
            Profesorii noștri sunt artiști dedicați care adaptează fiecare lecție la personalitatea și ritmul fiecărui elev.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
            {vals.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ display: 'flex', gap: 14, padding: '18px', background: 'var(--ink)', transition: 'background-color 0.25s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--ink-raised)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--ink)'; }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{v.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13.5, color: '#fff', margin: '0 0 4px' }}>{v.title}</p>
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: 0 }}>{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <style>{`
        .img-hover-zoom:hover img { transform: scale(1.05); }
        @media (max-width: 900px) { .about-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
