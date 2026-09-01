'use client';
import { motion } from 'framer-motion';
import AnimatedCounter from './ui/AnimatedCounter';

const stats = [
  { val: 300,  suf: '+', label: 'Elevi',           desc: 'care și-au descoperit talentul', icon: '🎓' },
  { val: 10,   suf: '+', label: 'Ani experiență',   desc: 'de muzică și educație premium',  icon: '🏆' },
  { val: 1000, suf: '+', label: 'Ore de curs',      desc: 'predate cu pasiune și dedicare', icon: '🎵' },
  { val: 95,   suf: '%', label: 'Recomandări',      desc: 'dintre elevi recomandă școala',  icon: '⭐' },
];

const reasons = [
  { text: 'Profesori cu experiență internațională', icon: '🌍' },
  { text: 'Lecții individualizate pentru fiecare elev', icon: '🎯' },
  { text: 'Instrumente de calitate profesională', icon: '🎸' },
  { text: 'Program flexibil adaptat nevoilor tale', icon: '📅' },
  { text: 'Concerte și recitaluri regulate', icon: '🎭' },
  { text: 'Metodă pedagogică modernă și eficientă', icon: '✨' },
];

export default function WhyUs() {
  return (
    <section style={{ padding: '120px 24px', background: 'var(--ink-raised)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 72 }}>
          <span className="eyebrow" style={{ justifyContent: 'center', marginBottom: 20 }}>De ce noi</span>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 56px)', fontWeight: 900, color: '#fff', margin: '16px 0 18px', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
            De ce să alegi <span style={{ color: 'var(--orange)' }}>Arry Production</span>?
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.42)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
            Nu suntem doar o școală — suntem o comunitate de artiști în devenire.
          </p>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginBottom: 96 }} className="stats-grid">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ textAlign: 'center', padding: '36px 24px', background: 'var(--ink-raised)', transition: 'background-color 0.25s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#17171a'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--ink-raised)'; }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
              <p style={{ fontSize: 46, fontWeight: 900, color: 'var(--orange)', lineHeight: 1, margin: '0 0 8px' }}>
                <AnimatedCounter to={s.val} suffix={s.suf} />
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Reasons + image */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="reasons-grid">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h3 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 900, color: '#fff', margin: '0 0 32px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Ceea ce ne<br /><span style={{ color: 'var(--orange)' }}>diferențiază</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {reasons.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 4px', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                  <span style={{ fontSize: 14.5, fontWeight: 500, color: 'rgba(255,255,255,0.72)' }}>{r.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} style={{ position: 'relative' }}>
            <div style={{ overflow: 'hidden', border: '1px solid var(--line)', position: 'relative' }} className="img-hover-zoom">
              <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=85&fit=crop" alt="Concert" style={{ width: '100%', height: 440, objectFit: 'cover', display: 'block', transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
            </div>
            {/* Badge */}
            <div style={{ position: 'absolute', bottom: -1, left: -1, background: 'var(--ink)', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--line)' }}>
              <span style={{ fontSize: 26 }}>🏆</span>
              <div>
                <p style={{ fontWeight: 800, fontSize: 13.5, color: '#fff', margin: 0 }}>Premiați la concursuri</p>
                <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>Naționale și internaționale</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`
        .img-hover-zoom:hover img { transform: scale(1.05); }
        @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } .reasons-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
