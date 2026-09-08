'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocale } from '@/lib/i18n';

const ease = [0.22, 1, 0.36, 1] as const;

const avatars = [
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&q=80&auto=format&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&q=80&auto=format&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&q=80&auto=format&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80&auto=format&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80&auto=format&fit=crop&crop=face',
];

export default function Testimonials() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const { t: tr } = useLocale();
  const data = tr.testimonials.data.map((d, i) => ({ ...d, avatar: avatars[i] }));
  const go = (i: number) => { setDir(i > idx ? 1 : -1); setIdx((i + data.length) % data.length); };
  const t = data[idx];

  return (
    <section style={{ padding: 'clamp(64px, 9vh, 104px) 32px', background: 'var(--bg-alt)', overflow: 'hidden' }}>
      <hr className="rule" style={{ maxWidth: 1240, margin: '0 auto 54px' }} />
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease }} style={{ marginBottom: 48 }}>
          <span className="eyebrow" style={{ marginBottom: 22 }}>{tr.testimonials.eyebrow}</span>
          <h2 style={{ fontSize: 'clamp(30px, 3.6vw, 50px)', fontWeight: 800, color: 'var(--tx)', margin: '16px 0 0', lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            {tr.testimonials.titleLines[0]}<br />{tr.testimonials.titleLines[1]}
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center' }} className="tst-row">
          <motion.button onClick={() => go(idx - 1)} aria-label={tr.testimonials.prevAria} className="tst-arrow" whileHover={{ scale: 1.1, x: -3 }} whileTap={{ scale: 0.92 }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </motion.button>

          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div key={idx}
                initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.35, ease }}
                style={{ border: '1px solid var(--line)', padding: '40px 40px', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
                  <motion.img src={t.avatar} alt={t.name} className="ph" whileHover={{ scale: 1.08 }} transition={{ duration: 0.3, ease }}
                    style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: '50%' }} />
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--tx)', margin: '0 0 3px' }}>{t.name}</p>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sand-deep)', margin: 0 }}>{t.role}</p>
                  </div>
                  <motion.span initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
                    style={{ marginLeft: 'auto', color: 'var(--orange)', fontSize: 13, letterSpacing: 2 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.span key={i} variants={{ hidden: { opacity: 0, scale: 0.4 }, show: { opacity: 1, scale: 1 } }} transition={{ duration: 0.3, ease }} style={{ display: 'inline-block' }}>★</motion.span>
                    ))}
                  </motion.span>
                </div>
                <p style={{ fontSize: 17, color: 'var(--tx)', lineHeight: 1.75, fontStyle: 'italic', margin: 0, fontFamily: 'var(--font-playfair), serif' }}>
                  „{t.text}”
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.button onClick={() => go(idx + 1)} aria-label={tr.testimonials.nextAria} className="tst-arrow" whileHover={{ scale: 1.1, x: 3 }} whileTap={{ scale: 0.92 }}>
            <ArrowRight style={{ width: 18, height: 18 }} />
          </motion.button>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
          {data.map((_, i) => (
            <motion.button key={i} onClick={() => go(i)} aria-label={`Testimonial ${i + 1}`} whileHover={{ scaleY: 1.8 }}
              animate={{ width: i === idx ? 28 : 14, background: i === idx ? 'var(--orange)' : 'var(--line-strong)' }} transition={{ duration: 0.3, ease }}
              style={{ height: 2, border: 'none', cursor: 'pointer' }} />
          ))}
        </div>
      </div>

      <style>{`
        .tst-arrow {
          width: 44px; height: 44px; border: 1px solid var(--line); background: transparent;
          color: var(--tx-mut); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: border-color 0.2s, color 0.2s; flex-shrink: 0;
        }
        .tst-arrow:hover { border-color: var(--orange); color: var(--orange); }
        @media (max-width: 720px) {
          .tst-row { grid-template-columns: 1fr !important; }
          .tst-row .tst-arrow { display: none; }
        }
      `}</style>
    </section>
  );
}
