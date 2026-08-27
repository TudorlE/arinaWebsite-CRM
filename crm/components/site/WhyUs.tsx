'use client';
import { motion } from 'framer-motion';
import AnimatedCounter from './ui/AnimatedCounter';
import { BLACK, OFFWHITE, LIME, HAIRLINE_ON_WHITE, display, body } from './theme';

const stats = [
  { val: 300,  suf: '+', label: 'Elevi' },
  { val: 10,   suf: '+', label: 'Ani experiență' },
  { val: 1000, suf: '+', label: 'Ore de curs' },
  { val: 95,   suf: '%', label: 'Recomandări' },
];

const reasons = [
  'Profesori cu experiență internațională',
  'Lecții individualizate pentru fiecare elev',
  'Instrumente de calitate profesională',
  'Program flexibil adaptat nevoilor tale',
  'Concerte și recitaluri regulate',
  'Metodă pedagogică modernă și eficientă',
];

export default function WhyUs() {
  return (
    <section style={{ padding: '120px 24px', background: OFFWHITE }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${HAIRLINE_ON_WHITE}`, borderBottom: `1px solid ${HAIRLINE_ON_WHITE}`, marginBottom: 100 }} className="stats-grid">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ padding: '40px 24px', borderRight: i < stats.length - 1 ? `1px solid ${HAIRLINE_ON_WHITE}` : 'none' }}>
              <p style={{ fontFamily: display, fontSize: 'clamp(40px, 5vw, 64px)', color: BLACK, lineHeight: 1, margin: '0 0 10px' }}>
                <AnimatedCounter to={s.val} suffix={s.suf} />
              </p>
              <p style={{ fontFamily: body, fontSize: 12, fontWeight: 700, color: 'rgba(2,7,7,0.55)', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Reasons + image */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'start' }} className="reasons-grid">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: body, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20, color: BLACK }}>
              <span style={{ width: 24, height: 1, background: BLACK, display: 'inline-block' }} /> De ce noi
            </span>
            <h3 style={{ fontFamily: display, fontSize: 'clamp(34px, 4vw, 56px)', color: BLACK, margin: '0 0 40px', letterSpacing: '-0.01em', lineHeight: 0.95, textTransform: 'uppercase' }}>
              Ceea ce ne<br />diferențiază
            </h3>
            <div>
              {reasons.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: `1px solid ${HAIRLINE_ON_WHITE}` }}>
                  <span style={{ width: 6, height: 6, background: LIME, flexShrink: 0, border: `1px solid ${BLACK}` }} />
                  <span style={{ fontFamily: body, fontSize: 15, fontWeight: 500, color: BLACK }}>{r}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} style={{ position: 'relative' }}>
            <div style={{ overflow: 'hidden' }}>
              <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=85&fit=crop" alt="Concert" style={{ width: '100%', height: 480, objectFit: 'cover', display: 'block', filter: 'grayscale(0.35) contrast(1.1)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: -1, right: -1, background: BLACK, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${BLACK}` }}>
              <div>
                <p style={{ fontFamily: body, fontWeight: 800, fontSize: 13, color: OFFWHITE, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Premiați la concursuri</p>
                <p style={{ fontFamily: body, fontSize: 11, color: LIME, margin: '3px 0 0', fontWeight: 600 }}>Naționale și internaționale</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } .reasons-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
