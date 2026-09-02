'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const data = [
  { name: 'Maria Ionescu', role: 'Mamă a unui elev de pian', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80&fit=crop&crop=face', text: 'Fiul meu are 8 ani și în 6 luni de la Arry Production a progresat incredibil. Nu îl mai poți scoate de la pian! Profesorii sunt răbdători și plini de entuziasm.' },
  { name: 'Alexandru Popa', role: 'Elev de tobe, 16 ani', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&fit=crop&crop=face', text: 'Am venit fără nicio experiență și acum cânt în trupa școlii. Atmosfera de aici este de neegalat — simți că muzica curge prin sălile de curs.' },
  { name: 'Elena Dragomir', role: 'Elevă de canto, 24 ani', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80&fit=crop&crop=face', text: 'Visam să cânt de mică. La Arry Production mi-am găsit vocea și mai mult decât atât — mi-am găsit comunitatea. Profesorul meu m-a ajutat să depășesc emoțiile scenice.' },
  { name: 'Radu Constantin', role: 'Tată a două eleve', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80&fit=crop&crop=face', text: 'Ambele fiice ale mele sunt la Arry Production de 2 ani. Rezultatele sunt vizibile, iar recitalurile de final de an sunt emoționante. Recomand cu căldură!' },
  { name: 'Cristina Marin', role: 'Elevă de pian, 30 ani', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80&fit=crop&crop=face', text: 'Niciodată nu e prea târziu să înveți muzică! La 30 de ani am început pianul de la zero și acum cânt piese pe care le admiram la alții.' },
];

export default function Testimonials() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (i: number) => { setDir(i > idx ? 1 : -1); setIdx(i); };

  return (
    <section style={{ padding: '120px 24px', background: 'var(--ink-raised)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="eyebrow" style={{ justifyContent: 'center', marginBottom: 20 }}>Testimoniale</span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, color: '#fff', margin: '16px 0 16px', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
            Ce spun elevii noștri
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0 }}>
            Poveștile lor sunt motivul pentru care facem asta în fiecare zi.
          </p>
        </motion.div>

        {/* Card */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={idx} custom={dir}
              initial={{ opacity: 0, x: dir * 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -50 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'var(--ink)', padding: '48px 44px',
                border: '1px solid var(--line)',
                textAlign: 'center',
              }}>
              {/* Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 24 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} style={{ color: 'var(--orange)', fontSize: 16 }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.78)', lineHeight: 1.78, fontStyle: 'italic', maxWidth: 580, margin: '0 auto 40px' }}>
                {data[idx].text}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <img src={data[idx].avatar} alt={data[idx].name}
                  style={{ width: 60, height: 60, objectFit: 'cover', border: '1px solid var(--line-strong)' }} />
                <div>
                  <p style={{ fontWeight: 900, fontSize: 16, color: '#fff', margin: '0 0 4px' }}>{data[idx].name}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--orange)', margin: 0 }}>{data[idx].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 36 }}>
          <button onClick={() => go((idx - 1 + data.length) % data.length)}
            style={{ width: 42, height: 42, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.22s', color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--orange)'; el.style.color = 'var(--orange)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--line)'; el.style.color = 'rgba(255,255,255,0.6)'; }}>
            ‹
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {data.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                style={{ height: 2, border: 'none', cursor: 'pointer', transition: 'all 0.3s', background: i === idx ? 'var(--orange)' : 'rgba(255,255,255,0.18)', width: i === idx ? 28 : 14 }} />
            ))}
          </div>
          <button onClick={() => go((idx + 1) % data.length)}
            style={{ width: 42, height: 42, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.22s', color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--orange)'; el.style.color = 'var(--orange)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--line)'; el.style.color = 'rgba(255,255,255,0.6)'; }}>
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
