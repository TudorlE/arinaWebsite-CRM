'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X } from 'lucide-react';
import { Reveal, Stagger, StaggerItem, EASE } from '@/components/motionx';

/**
 * TODO: înlocuiește `id` cu ID-urile reale ale videoclipurilor de pe
 * canalul de YouTube Arry Production (recitaluri, elevi, concursuri).
 * ID-ul e partea de după `watch?v=` din link-ul YouTube.
 */
const videos = [
  { id: 'jNQXAC9IVRw', title: 'Recital de pian — clasa de începători', who: 'Elevii Arry Studio' },
  { id: 'M7lc1UVf-VE', title: 'Canto — spectacol de final de an', who: 'Corul școlii' },
  { id: 'aqz-KE-bpKQ', title: 'Chitară & tobe — trupa școlii live', who: 'Trupa Arry' },
  { id: 'ScMzIvxBSi4', title: 'Concurs internațional — premianții noștri', who: 'Elevi premiați' },
  { id: 'kJQP7kiw5Fk', title: 'Sesiune de studio — prima piesă', who: 'Studio Arry' },
  { id: 'e-ORhEE9VVg', title: 'Solfegiu în practică — atelier deschis', who: 'Atelier' },
];

function Thumb({ id }: { id: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg, #1B1611, #2A211A)' }} />;
  return (
    <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="ph" onError={() => setFailed(true)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
  );
}

export default function Gallery() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section id="galerie" style={{ padding: 'clamp(64px, 9vh, 104px) 32px', background: 'var(--bg)' }}>
      <hr className="rule" style={{ maxWidth: 1240, margin: '0 auto 54px' }} />
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 48 }}>
          <div>
            <Reveal><span className="eyebrow" style={{ marginBottom: 22, display: 'inline-flex' }}>07 — Galerie video</span></Reveal>
            <Reveal delay={0.08}>
              <h2 style={{ fontSize: 'clamp(27px, 6vw, 56px)', fontWeight: 800, color: 'var(--tx)', margin: '16px 0 0', lineHeight: 1.0, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Momente<br />muzicale
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <p style={{ fontSize: 14, color: 'var(--tx-mut)', maxWidth: 320, margin: 0, lineHeight: 1.7 }}>
              Recitaluri, concerte și elevii noștri pe scenă — direct de pe canalul nostru de YouTube.
            </p>
          </Reveal>
        </div>

        <Stagger className="vid-grid">
          {videos.map(v => (
            <StaggerItem key={v.id}>
              <motion.button
                onClick={() => setActive(v.id)}
                whileHover="hover" initial="rest" animate="rest"
                className="vid-card"
                style={{ width: '100%', textAlign: 'left', border: '1px solid var(--line)', background: 'var(--bg)', padding: 0, cursor: 'pointer', display: 'block', overflow: 'hidden' }}
              >
                <div style={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden' }}>
                  <motion.div variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }} transition={{ duration: 0.7, ease: EASE }} style={{ position: 'absolute', inset: 0 }}>
                    <Thumb id={v.id} />
                  </motion.div>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(16,13,11,0.8), rgba(16,13,11,0.1) 60%)' }} />
                  <motion.span
                    variants={{ rest: { scale: 1, opacity: 0.9 }, hover: { scale: 1.12, opacity: 1 } }}
                    transition={{ duration: 0.3, ease: EASE }}
                    style={{ position: 'absolute', top: '50%', left: '50%', x: '-50%', y: '-50%', width: 56, height: 56, borderRadius: '50%', border: '1.5px solid rgba(242,237,230,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,13,11,0.35)' }}
                  >
                    <Play style={{ width: 20, height: 20, color: 'var(--tx)', marginLeft: 3 }} fill="currentColor" />
                  </motion.span>
                </div>
                <div style={{ padding: '16px 18px 18px' }}>
                  <p style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--tx)', margin: '0 0 4px', lineHeight: 1.35 }}>{v.title}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sand-deep)', margin: 0 }}>{v.who}</p>
                </div>
              </motion.button>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onClick={() => setActive(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(6,5,4,0.9)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35, ease: EASE }}
              style={{ width: '100%', maxWidth: 960, position: 'relative' }}>
              <button onClick={() => setActive(null)} aria-label="Închide" style={{ position: 'absolute', top: -46, right: 0, width: 38, height: 38, border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--tx)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
              <div style={{ position: 'relative', aspectRatio: '16 / 9', border: '1px solid var(--line-strong)', background: '#000' }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${active}?autoplay=1&rel=0`}
                  title="Videoclip Arry Studio"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .vid-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .vid-card { transition: border-color 0.3s ease; }
        .vid-card:hover { border-color: var(--sand-deep); }
        @media (max-width: 880px) { .vid-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 540px) { .vid-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
