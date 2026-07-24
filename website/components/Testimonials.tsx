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
    <section style={{ padding: '120px 24px', background: 'linear-gradient(180deg, #07040f 0%, #0a0516 50%, #07040f 100%)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ display: 'inline-block', padding: '7px 18px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20, background: 'rgba(255,213,74,0.1)', color: '#FFD54A', border: '1px solid rgba(255,213,74,0.2)' }}>
            Testimoniale
          </span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
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
              initial={{ opacity: 0, x: dir * 70 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -70 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                borderRadius: 28, padding: '48px 44px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                textAlign: 'center', backdropFilter: 'blur(10px)',
              }}>
              {/* Quote mark */}
              <div style={{ fontSize: 80, lineHeight: 0.8, color: 'rgba(255,213,74,0.15)', fontFamily: 'Georgia, serif', marginBottom: 20, userSelect: 'none' }}>"</div>
              {/* Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 24 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} style={{ color: '#FFD54A', fontSize: 18, textShadow: '0 0 12px rgba(255,213,74,0.6)' }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.78)', lineHeight: 1.78, fontStyle: 'italic', maxWidth: 580, margin: '0 auto 40px' }}>
                {data[idx].text}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <img src={data[idx].avatar} alt={data[idx].name}
                  style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,213,74,0.4)', boxShadow: '0 0 24px rgba(255,213,74,0.2)' }} />
                <div>
                  <p style={{ fontWeight: 900, fontSize: 17, color: '#fff', margin: '0 0 4px' }}>{data[idx].name}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#FFD54A', margin: 0, opacity: 0.85 }}>{data[idx].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 36 }}>
          <button onClick={() => go((idx - 1 + data.length) % data.length)}
            style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.22s', color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,213,74,0.12)'; el.style.borderColor = 'rgba(255,213,74,0.3)'; el.style.color = '#FFD54A'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.06)'; el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.color = 'rgba(255,255,255,0.6)'; }}>
            ‹
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {data.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                style={{ height: 8, borderRadius: 99, border: 'none', cursor: 'pointer', transition: 'all 0.3s', background: i === idx ? '#FFD54A' : 'rgba(255,255,255,0.15)', width: i === idx ? 28 : 8, boxShadow: i === idx ? '0 0 12px rgba(255,213,74,0.5)' : 'none' }} />
            ))}
          </div>
          <button onClick={() => go((idx + 1) % data.length)}
            style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.22s', color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,213,74,0.12)'; el.style.borderColor = 'rgba(255,213,74,0.3)'; el.style.color = '#FFD54A'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.06)'; el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.color = 'rgba(255,255,255,0.6)'; }}>
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
