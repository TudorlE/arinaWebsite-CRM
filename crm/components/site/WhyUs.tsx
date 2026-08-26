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
    <section style={{ padding: '120px 24px', background: 'linear-gradient(180deg, #100A06 0%, #150F09 50%, #100A06 100%)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 72 }}>
          <span style={{ display: 'inline-block', padding: '7px 18px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20, background: 'rgba(201,123,94,0.1)', color: '#C97B5E', border: '1px solid rgba(201,123,94,0.2)' }}>
            De ce noi
          </span>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 56px)', fontWeight: 900, color: '#fff', margin: '0 0 18px', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
            De ce să alegi <span style={{ color: '#F4A85C' }}>Arry Production</span>?
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.42)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
            Nu suntem doar o școală — suntem o comunitate de artiști în devenire.
          </p>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 96 }} className="stats-grid">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{
                textAlign: 'center', padding: '36px 24px', borderRadius: 24,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                border: '1px solid rgba(255,255,255,0.07)',
                transition: 'all 0.35s', cursor: 'default',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'rgba(244,168,92,0.4)';
                el.style.transform = 'translateY(-6px)';
                el.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(244,168,92,0.1)';
                el.style.background = 'linear-gradient(145deg, rgba(244,168,92,0.07), rgba(244,168,92,0.02))';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'rgba(255,255,255,0.07)';
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
                el.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))';
              }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
              <p style={{ fontSize: 52, fontWeight: 900, color: '#F4A85C', lineHeight: 1, margin: '0 0 8px', textShadow: '0 0 30px rgba(244,168,92,0.3)' }}>
                <AnimatedCounter to={s.val} suffix={s.suf} />
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Reasons + image */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="reasons-grid">
          <motion.div initial={{ opacity: 0, x: -44 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h3 style={{ fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 900, color: '#fff', margin: '0 0 32px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Ceea ce ne<br /><span style={{ color: '#F4A85C' }}>diferențiază</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reasons.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderRadius: 14, transition: 'all 0.22s', cursor: 'default', border: '1px solid transparent' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'rgba(244,168,92,0.06)';
                    el.style.borderColor = 'rgba(244,168,92,0.15)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'transparent';
                    el.style.borderColor = 'transparent';
                  }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{r.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.72)' }}>{r.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 44 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ position: 'relative' }}>
            {/* Glow behind image */}
            <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(ellipse, rgba(156,74,30,0.2) 0%, transparent 70%)', borderRadius: 40, pointerEvents: 'none' }} />
            <div style={{ borderRadius: 28, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)', position: 'relative' }}>
              <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=85&fit=crop" alt="Concert" style={{ width: '100%', height: 440, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,9,5,0.6) 0%, transparent 50%)' }} />
            </div>
            {/* Badge */}
            <div style={{ position: 'absolute', bottom: -20, left: -20, background: 'rgba(16,10,6,0.92)', backdropFilter: 'blur(16px)', borderRadius: 18, padding: '16px 22px', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid rgba(244,168,92,0.2)' }}>
              <span style={{ fontSize: 30 }}>🏆</span>
              <div>
                <p style={{ fontWeight: 800, fontSize: 14, color: '#fff', margin: 0 }}>Premiați la concursuri</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>Naționale și internaționale</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } .reasons-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
