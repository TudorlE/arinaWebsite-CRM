'use client';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles, CalendarClock, TrendingUp, Phone, Mic2, Users2, Rocket } from 'lucide-react';
import { Reveal, Stagger, StaggerItem, EASE } from '@/components/motionx';
import { openBooking } from '@/components/Booking';
import { useLocale } from '@/lib/i18n';

const stepIcons = [Phone, Mic2, Users2, Rocket];
const planIcons = [Sparkles, CalendarClock, TrendingUp];

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

        <div className="steps-wrap">
          <motion.div className="steps-line" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 1.1, ease: EASE }} />
          <Stagger className="steps-row">
            {c.steps.map((st, i) => {
              const Icon = stepIcons[i];
              return (
                <StaggerItem key={st}>
                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3, ease: EASE }} className="step-node">
                    <span className="step-circle">
                      <Icon style={{ width: 18, height: 18 }} />
                    </span>
                    <span className="step-index">{String(i + 1).padStart(2, '0')}</span>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)', margin: '10px 0 0', lineHeight: 1.5 }}>{st}</p>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>

        <Reveal delay={0.1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', margin: '44px 0 56px' }}>
            <button onClick={openBooking} className="btn-outline solid">{c.ctaBtn}</button>
            <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--tx-faint)' }}>{c.ctaNote}</span>
          </div>
        </Reveal>

        <Stagger className="plans-row">
          {c.plans.map((p, i) => {
            const Icon = planIcons[i];
            return (
              <StaggerItem key={p.name} style={{ height: '100%' }}>
                <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.35, ease: EASE }} className="plan-card"
                  style={{
                    border: p.featured ? '1px solid var(--sand-deep)' : '1px solid var(--line)',
                    padding: '32px 28px', height: '100%', display: 'flex', flexDirection: 'column', gap: 4,
                    background: p.featured ? 'linear-gradient(160deg, rgba(216,184,146,0.1), transparent 60%)' : 'transparent',
                    position: 'relative', overflow: 'hidden',
                  }}>
                  {p.featured && (
                    <span style={{ position: 'absolute', top: 0, right: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sand-ink)', background: 'var(--accent)', padding: '7px 14px 6px' }}>
                      {c.featuredBadge}
                    </span>
                  )}
                  <Icon style={{ width: 26, height: 26, color: 'var(--accent)', strokeWidth: 1.3, marginBottom: 18 }} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tx-faint)' }}>{p.name}</span>
                  <p style={{ fontSize: 36, fontWeight: 800, color: p.featured ? 'var(--sand)' : 'var(--tx)', margin: '6px 0 0', fontFamily: 'var(--font-playfair), serif', letterSpacing: '-0.01em' }}>{p.price}</p>
                  <p style={{ fontSize: 13, color: 'var(--tx-mut)', margin: '14px 0 24px', lineHeight: 1.6, flex: 1 }}>{p.note}</p>
                  <button onClick={openBooking} className="btn-outline plan-btn" style={{ width: '100%' }}>{c.planCta}</button>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>

      <style>{`
        .svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .svc-card { transition: border-color 0.3s ease; }
        .svc-card:hover { border-color: var(--sand-deep); }

        .steps-wrap { position: relative; }
        .steps-line { position: absolute; top: 26px; left: 12.5%; right: 12.5%; height: 1px; background: var(--line-strong); transform-origin: 0%; }
        .steps-row { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; z-index: 1; }
        .step-node { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .step-circle {
          width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-alt); border: 1px solid var(--sand-deep); color: var(--accent);
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        .step-node:hover .step-circle { background: var(--accent); color: var(--sand-ink); }
        .step-index { display: block; margin-top: 10px; font-family: var(--font-playfair), serif; font-size: 12px; color: var(--tx-faint); letter-spacing: 0.1em; }

        .plans-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .plan-card { transition: border-color 0.35s ease, box-shadow 0.35s ease; }
        .plan-card:hover { border-color: var(--sand-deep); box-shadow: 0 18px 40px rgba(0,0,0,0.14); }
        .plan-btn { position: relative; }

        @media (max-width: 880px) { .svc-grid { grid-template-columns: 1fr 1fr; } .plans-row { grid-template-columns: 1fr; } }
        @media (max-width: 700px) { .steps-row { grid-template-columns: 1fr 1fr; row-gap: 36px; } .steps-line { display: none; } }
        @media (max-width: 540px) { .svc-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
