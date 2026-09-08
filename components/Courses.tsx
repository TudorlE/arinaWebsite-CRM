'use client';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Reveal, Stagger, StaggerItem, EASE } from '@/components/motionx';
import { openBooking } from '@/components/Booking';
import { useLocale } from '@/lib/i18n';

const serviceMeta = [
  { n: '01', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=700&q=80&auto=format&fit=crop' },
  { n: '02', img: 'https://images.unsplash.com/photo-1552422535-c45813c61732?w=700&q=80&auto=format&fit=crop' },
  { n: '03', img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=700&q=80&auto=format&fit=crop' },
  { n: '04', img: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=700&q=80&auto=format&fit=crop' },
  { n: '05', img: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=700&q=80&auto=format&fit=crop' },
  { n: '06', img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=700&q=80&auto=format&fit=crop' },
];

export default function Courses() {
  const { t } = useLocale();
  const c = t.courses;
  const services = c.services.map((s, i) => ({ ...s, ...serviceMeta[i] }));
  return (
    <section id="cursuri" style={{ background: 'var(--bg-alt)', padding: 'clamp(64px, 9vh, 104px) 32px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 48 }}>
          <div>
            <Reveal><span className="eyebrow" style={{ marginBottom: 22, display: 'inline-flex' }}>{c.eyebrow}</span></Reveal>
            <Reveal delay={0.08}>
              <h2 style={{ fontSize: 'clamp(27px, 6vw, 60px)', lineHeight: 1.0, letterSpacing: '-0.02em', textTransform: 'uppercase', fontWeight: 800, margin: '16px 0 0', color: 'var(--tx)' }}>
                {c.titleLines[0]}<br />{c.titleLines[1]}
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ maxWidth: 250, padding: '13px 16px', border: '1px solid rgba(225,29,29,0.45)', background: 'rgba(225,29,29,0.1)' }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--red)', letterSpacing: '0.03em', margin: 0, lineHeight: 1.5 }}>
                {c.badge}
              </p>
            </motion.div>
          </Reveal>
        </div>

        <Stagger className="svc-grid">
          {services.map(s => (
            <StaggerItem key={s.title} style={{ height: '100%' }}>
              <motion.button
                onClick={openBooking}
                className="svc-card"
                whileHover="hover"
                initial="rest"
                animate="rest"
                style={{ width: '100%', textAlign: 'left', border: '1px solid var(--line)', background: 'var(--bg)', padding: 0, cursor: 'pointer', display: 'block', overflow: 'hidden' }}
              >
                <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 3' }}>
                  <motion.img
                    src={s.img} alt={s.title} className="ph"
                    variants={{ rest: { scale: 1 }, hover: { scale: 1.08 } }}
                    transition={{ duration: 0.7, ease: EASE }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(16,13,11,0.9) 0%, rgba(16,13,11,0.15) 55%, transparent 100%)' }} />
                  <span style={{ position: 'absolute', top: 14, left: 16, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#D8B892' }}>{s.n}</span>
                  <motion.span
                    variants={{ rest: { x: 0, y: 0, opacity: 0.7 }, hover: { x: 3, y: -3, opacity: 1 } }}
                    style={{ position: 'absolute', top: 12, right: 12, color: '#F2EDE6' }}
                  >
                    <ArrowUpRight style={{ width: 20, height: 20 }} />
                  </motion.span>
                  <h3 style={{ position: 'absolute', left: 16, bottom: 14, right: 16, fontSize: 'clamp(20px, 2.4vw, 26px)', fontWeight: 700, color: '#F2EDE6', margin: 0, lineHeight: 1.1 }}>
                    {s.title}
                  </h3>
                </div>
                <div style={{ padding: '18px 18px 20px' }}>
                  <p style={{ fontSize: 13.5, color: 'var(--tx-mut)', margin: 0, lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </motion.button>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Become part of us */}
        <hr className="rule" style={{ margin: '78px 0 46px' }} />

        <Reveal>
          <span className="eyebrow" style={{ marginBottom: 22, display: 'inline-flex' }}>{c.stepsEyebrow}</span>
          <h2 style={{ fontSize: 'clamp(25px, 5vw, 46px)', lineHeight: 1.02, letterSpacing: '-0.02em', textTransform: 'uppercase', fontWeight: 800, margin: '14px 0 40px', color: 'var(--tx)' }}>
            {c.stepsTitleLines[0]}<br />{c.stepsTitleLines[1]}
          </h2>
        </Reveal>

        <Stagger className="steps-row">
          {c.steps.map((st, i) => (
            <StaggerItem key={st} style={{ flex: 1, minWidth: 190 }}>
              <motion.div whileHover={{ backgroundColor: 'rgba(216,184,146,0.05)' }} style={{ padding: '24px 16px 24px 0', borderTop: '1px solid var(--line-strong)', height: '100%' }}>
                <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 26, color: 'var(--accent)', display: 'block', marginBottom: 12 }}>{i + 1}</span>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)', margin: 0, lineHeight: 1.5 }}>{st}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', margin: '36px 0 56px' }}>
            <button onClick={openBooking} className="btn-outline solid">{c.ctaBtn}</button>
            <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--tx-faint)' }}>{c.ctaNote}</span>
          </div>
        </Reveal>

        <Stagger className="plans-row">
          {c.plans.map(p => (
            <StaggerItem key={p.name} style={{ height: '100%' }}>
              <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3, ease: EASE }}
                style={{
                  border: p.featured ? '1px solid var(--sand-deep)' : '1px solid var(--line)',
                  padding: '30px 26px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16,
                  background: p.featured ? 'rgba(216,184,146,0.06)' : 'transparent',
                }}>
                {p.featured && <span style={{ alignSelf: 'flex-start', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sand-ink)', background: 'var(--accent)', padding: '3px 8px' }}>{c.featuredBadge}</span>}
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tx-faint)' }}>{p.name}</span>
                <p style={{ fontSize: 34, fontWeight: 800, color: p.featured ? 'var(--sand)' : 'var(--tx)', margin: 0, fontFamily: 'var(--font-playfair), serif' }}>{p.price}</p>
                <p style={{ fontSize: 13, color: 'var(--tx-mut)', margin: 0, lineHeight: 1.6, flex: 1 }}>{p.note}</p>
                <button onClick={openBooking} className="btn-outline" style={{ width: '100%' }}>{c.planCta}</button>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

        <p style={{ fontSize: 12, color: 'var(--tx-faint)', margin: '22px 0 0' }}>
          {c.disclaimer}
        </p>
      </div>

      <style>{`
        .svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .svc-card { transition: border-color 0.3s ease; }
        .svc-card:hover { border-color: var(--sand-deep); }
        .steps-row { display: flex; gap: 24px; flex-wrap: wrap; }
        .plans-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 880px) { .svc-grid { grid-template-columns: 1fr 1fr; } .plans-row { grid-template-columns: 1fr; } }
        @media (max-width: 540px) { .svc-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
