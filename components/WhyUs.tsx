'use client';
import { motion } from 'framer-motion';
import { Users, Layers, Trophy, Music2, UserRound, CalendarClock, Clock3 } from 'lucide-react';
import { Reveal, CountUp, EASE } from '@/components/motionx';

const reasons = [
  { t: 'Metode moderne\nde predare', d: 'Îmbinăm teoria cu practica, într-un spațiu gândit pentru concentrare și creativitate.' },
  { t: 'Scenă și\nconcursuri', d: 'Elevii noștri urcă pe scenă la recitaluri și concursuri naționale și internaționale.' },
  { t: 'Program\nflexibil', d: 'Orare adaptate fiecărui elev, în inima orașului, ușor de ajuns.' },
  { t: 'Atmosferă\nde creație', d: 'Profesori care sunt muzicieni activi și îți transmit dragostea pentru artă.' },
];

const stats = [
  { icon: Users, n: 300, suf: '+', unit: 'elevi', d: 'și-au descoperit talentul cu noi' },
  { icon: Layers, n: 10, suf: '', unit: 'direcții', d: 'de studiu, de la instrument la teorie' },
  { icon: Trophy, n: 25, suf: '+', unit: 'concursuri', d: 'și festivaluri naționale și internaționale' },
  { icon: Music2, text: 'Profesori', d: 'care sunt muzicieni activi pe scenă' },
];

const format = [
  { icon: UserRound, t: '1 la 1 cu profesorul', d: 'Atenție completă, ritm adaptat fiecărui elev.' },
  { icon: CalendarClock, t: 'Copii, adolescenți și adulți', d: 'De la 5 ani. Niciodată nu e prea târziu să începi.' },
  { icon: Clock3, t: '30–60 de minute', d: 'Durata ședinței, în funcție de nivel și vârstă.' },
];

const ReasonBlock = ({ t, d, align, delay }: { t: string; d: string; align: 'left' | 'right'; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: align === 'right' ? 34 : -34 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.7, ease: EASE, delay }}
    style={{ textAlign: align, maxWidth: 340 }}
  >
    <p style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', fontWeight: 700, color: 'var(--tx)', margin: 0, lineHeight: 1.15, whiteSpace: 'pre-line', fontFamily: 'var(--font-playfair), serif' }}>{t}</p>
    <p style={{ fontSize: 14, color: 'var(--tx-mut)', margin: '14px 0 0', lineHeight: 1.65 }}>{d}</p>
  </motion.div>
);

export default function WhyUs() {
  return (
    <section style={{ background: 'var(--bg)', padding: 'clamp(64px, 9vh, 104px) 32px' }}>
      <hr className="rule" style={{ maxWidth: 1240, margin: '0 auto 54px' }} />
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        <Reveal><span className="eyebrow centered" style={{ marginBottom: 8, width: '100%', justifyContent: 'center' }}>04 — De ce noi</span></Reveal>
        <Reveal delay={0.05}>
          <p style={{ textAlign: 'center', color: 'var(--tx-mut)', fontSize: 15, maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.7 }}>
            Patru motive pentru care părinții și elevii aleg Arry Studio.
          </p>
        </Reveal>

        <div className="radial">
          <div className="radial-col">
            <ReasonBlock {...reasons[0]} align="right" delay={0.1} />
            <ReasonBlock {...reasons[2]} align="right" delay={0.2} />
          </div>

          <motion.div className="radial-ring" initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.3 }}>
            <svg viewBox="0 0 420 420" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <motion.circle cx="210" cy="210" r="208" fill="none" stroke="var(--line-strong)" strokeWidth="1.2"
                variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1 } }} transition={{ duration: 1.8, ease: EASE }} />
              <motion.circle cx="210" cy="210" r="168" fill="none" stroke="var(--line)" strokeWidth="1"
                variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1 } }} transition={{ duration: 1.8, ease: EASE, delay: 0.15 }} />
              <motion.circle cx="210" cy="210" r="4" fill="var(--accent)"
                variants={{ hidden: { scale: 0 }, shown: { scale: 1 } }} transition={{ duration: 0.5, delay: 1 }} style={{ transformOrigin: 'center' }} />
            </svg>
            <motion.h2 variants={{ hidden: { opacity: 0, scale: 0.88 }, shown: { opacity: 1, scale: 1 } }} transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
              style={{ fontSize: 'clamp(40px, 5.5vw, 64px)', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.0, letterSpacing: '-0.02em', margin: 0, color: 'var(--tx)', position: 'relative', zIndex: 2 }}>
              De ce<br />noi?
            </motion.h2>
          </motion.div>

          <div className="radial-col">
            <ReasonBlock {...reasons[1]} align="left" delay={0.1} />
            <ReasonBlock {...reasons[3]} align="left" delay={0.2} />
          </div>
        </div>

        {/* Team stats */}
        <hr className="rule" style={{ margin: '86px 0 46px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 40 }}>
          <Reveal>
            <span className="eyebrow" style={{ marginBottom: 20, display: 'inline-flex' }}>05 — Echipa</span>
            <h2 style={{ fontSize: 'clamp(28px, 3.4vw, 46px)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '-0.02em', margin: '14px 0 0', color: 'var(--tx)', lineHeight: 1.02 }}>
              Suntem o echipă<br />profesionistă
            </h2>
          </Reveal>
        </div>

        <div className="stat-grid">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, ease: EASE, delay: i * 0.1 }}
              style={{ position: 'relative', padding: '30px 22px 26px', height: '100%' }}>
              <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: i * 0.1 + 0.1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--sand-deep)', transformOrigin: '0%' }} />
              <s.icon style={{ width: 24, height: 24, color: 'var(--sand)', strokeWidth: 1.3 }} />
              <p style={{ fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 700, color: 'var(--tx)', margin: '18px 0 6px', fontFamily: 'var(--font-playfair), serif', letterSpacing: '-0.01em' }}>
                {'text' in s
                  ? s.text
                  : <><CountUp value={s.n} suffix={s.suf} /> <span style={{ fontSize: '0.55em', color: 'var(--tx-mut)', fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600 }}>{s.unit}</span></>}
              </p>
              <p style={{ fontSize: 13, color: 'var(--tx-mut)', margin: 0, lineHeight: 1.55 }}>{s.d}</p>
            </motion.div>
          ))}
        </div>

        {/* Lesson format */}
        <hr className="rule" style={{ margin: '86px 0 46px' }} />
        <Reveal>
          <span className="eyebrow" style={{ marginBottom: 20, display: 'inline-flex' }}>06 — Formatul lecțiilor</span>
          <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '-0.02em', margin: '14px 0 40px', color: 'var(--tx)' }}>
            Cum se desfășoară
          </h2>
        </Reveal>
        <div className="fmt-grid">
          {format.map((f, i) => (
            <motion.div key={f.t} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, ease: EASE, delay: i * 0.1 }}
              whileHover="hover" className="fmt-card"
              style={{ border: '1px solid var(--line)', padding: '34px 28px', height: '100%', position: 'relative', overflow: 'hidden' }}>
              <motion.div variants={{ hover: { scaleX: 1 } }} initial={{ scaleX: 0 }} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: 'var(--accent)', transformOrigin: '0%' }} />
              <motion.span variants={{ hover: { rotate: -8, scale: 1.1 } }} style={{ display: 'inline-flex' }}>
                <f.icon style={{ width: 28, height: 28, color: 'var(--accent)', strokeWidth: 1.3 }} />
              </motion.span>
              <p style={{ fontSize: 19, fontWeight: 700, color: 'var(--tx)', margin: '24px 0 10px', fontFamily: 'var(--font-playfair), serif' }}>{f.t}</p>
              <p style={{ fontSize: 13.5, color: 'var(--tx-mut)', margin: 0, lineHeight: 1.65 }}>{f.d}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .radial { display: flex; align-items: center; justify-content: center; gap: clamp(20px, 5vw, 70px); flex-wrap: wrap; padding: 20px 0; }
        .radial-col { display: flex; flex-direction: column; gap: clamp(50px, 8vh, 90px); }
        .radial-ring { position: relative; width: clamp(300px, 40vw, 420px); height: clamp(300px, 40vw, 420px); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .fmt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 920px) {
          .radial { gap: 30px; }
          .radial-col { align-items: center; gap: 34px; width: 100%; }
          .radial-col > div { text-align: center !important; margin: 0 auto; }
          .stat-grid { grid-template-columns: 1fr 1fr; }
          .fmt-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 520px) { .stat-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
