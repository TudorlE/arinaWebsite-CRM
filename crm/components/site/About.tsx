'use client';
import { motion } from 'framer-motion';
import { BLACK, OFFWHITE, LIME, HAIRLINE_ON_WHITE, display, body } from './theme';

const vals = [
  { n: '01', title: 'Pasiune autentică', desc: 'Fiecare profesor iubește muzica și transmite această dragoste elevilor.' },
  { n: '02', title: 'Excelență artistică', desc: 'Metodă pedagogică modernă adaptată fiecărui elev, indiferent de nivel.' },
  { n: '03', title: 'Comunitate vibrantă', desc: 'O familie muzicală unită prin concerte, recitaluri și colaborări.' },
  { n: '04', title: 'Rezultate dovedite', desc: 'Sute de elevi au descoperit muzica cu noi, mulți ajungând la performanță.' },
];

export default function About() {
  return (
    <section id="despre" style={{ padding: '120px 24px', background: OFFWHITE }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 72, alignItems: 'start' }} className="about-grid">

        {/* Image */}
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative' }}>
          <div style={{ overflow: 'hidden', position: 'relative' }}>
            <img src="https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=85&fit=crop" alt="Lectie de muzica"
              style={{ width: '100%', height: 560, objectFit: 'cover', display: 'block', filter: 'grayscale(0.3) contrast(1.05)' }} />
          </div>
          <div style={{ position: 'absolute', bottom: -1, left: -1, background: BLACK, padding: '20px 28px', border: `1px solid ${BLACK}` }}>
            <p style={{ fontFamily: display, fontSize: 44, color: LIME, margin: 0, lineHeight: 1 }}>10+</p>
            <p style={{ fontFamily: body, fontSize: 11, fontWeight: 700, color: OFFWHITE, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6, margin: 0 }}>Ani de experiență</p>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: body, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20, color: BLACK }}>
            <span style={{ width: 24, height: 1, background: BLACK, display: 'inline-block' }} /> Despre noi
          </span>
          <h2 style={{ fontFamily: display, fontSize: 'clamp(40px, 5.5vw, 84px)', color: BLACK, lineHeight: 0.94, letterSpacing: '-0.01em', margin: '0 0 28px', textTransform: 'uppercase' }}>
            Arry<br />Production
          </h2>
          <p style={{ fontFamily: body, fontSize: 17, color: 'rgba(2,7,7,0.68)', lineHeight: 1.7, margin: '0 0 16px', maxWidth: 520 }}>
            Arry Production este mai mult decât o școală de muzică — este un loc unde copiii, adolescenții și adulții descoperă bucuria de a cânta, de a crea și de a se exprima liber prin artă.
          </p>
          <p style={{ fontFamily: body, fontSize: 17, color: 'rgba(2,7,7,0.68)', lineHeight: 1.7, margin: '0 0 48px', maxWidth: 520 }}>
            Profesorii noștri sunt artiști dedicați care adaptează fiecare lecție la personalitatea și ritmul fiecărui elev.
          </p>

          <div style={{ borderTop: `1px solid ${HAIRLINE_ON_WHITE}` }}>
            {vals.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ display: 'flex', gap: 20, padding: '20px 0', borderBottom: `1px solid ${HAIRLINE_ON_WHITE}` }}>
                <span style={{ fontFamily: display, fontSize: 15, color: LIME, flexShrink: 0, background: BLACK, padding: '3px 8px', height: 'fit-content' }}>{v.n}</span>
                <div>
                  <p style={{ fontFamily: body, fontWeight: 700, fontSize: 15, color: BLACK, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{v.title}</p>
                  <p style={{ fontFamily: body, fontSize: 13.5, color: 'rgba(2,7,7,0.55)', lineHeight: 1.5, margin: 0 }}>{v.desc}</p>
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
