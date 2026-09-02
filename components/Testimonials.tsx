'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

const data = [
  { name: 'Maria Ionescu', role: 'Mamă a unui elev de pian', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&q=80&auto=format&fit=crop&crop=face', text: 'Fiul meu are 8 ani și în 6 luni de la Arry Production a progresat incredibil. Nu îl mai poți scoate de la pian! Profesorii sunt răbdători și plini de entuziasm, iar recitalurile ne emoționează de fiecare dată.' },
  { name: 'Elena Dragomir', role: 'Elevă de canto, 24 ani', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&q=80&auto=format&fit=crop&crop=face', text: 'Visam să cânt de mică. La Arry Production mi-am găsit vocea și, mai mult decât atât, mi-am găsit comunitatea. Profesorul meu m-a ajutat să depășesc emoțiile scenice și acum urc pe scenă cu plăcere.' },
  { name: 'Radu Constantin', role: 'Tată a două eleve', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&q=80&auto=format&fit=crop&crop=face', text: 'Ambele fiice ale mele sunt la Arry Production de 2 ani. Rezultatele sunt vizibile, iar recitalurile de final de an sunt emoționante. Se simte că fiecare profesor își iubește meseria. Recomand cu căldură!' },
  { name: 'Alexandru Popa', role: 'Elev de tobe, 16 ani', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80&auto=format&fit=crop&crop=face', text: 'Am venit fără nicio experiență și acum cânt în trupa școlii. Atmosfera de aici este de neegalat — simți că muzica curge prin sălile de curs și că ești luat în serios de la prima lecție.' },
  { name: 'Cristina Marin', role: 'Elevă de pian, 30 ani', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80&auto=format&fit=crop&crop=face', text: 'Niciodată nu e prea târziu să înveți muzică. La 30 de ani am început pianul de la zero și acum cânt piese pe care le admiram la alții. Programul flexibil m-a ajutat să împac lecțiile cu serviciul.' },
];

export default function Testimonials() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const go = (i: number) => { setDir(i > idx ? 1 : -1); setIdx((i + data.length) % data.length); };
  const t = data[idx];

  return (
    <section style={{ padding: 'clamp(64px, 9vh, 104px) 32px', background: 'var(--bg-alt)', overflow: 'hidden' }}>
      <hr className="rule" style={{ maxWidth: 1240, margin: '0 auto 54px' }} />
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease }} style={{ marginBottom: 48 }}>
          <span className="eyebrow" style={{ marginBottom: 22 }}>07 — Păreri</span>
          <h2 style={{ fontSize: 'clamp(30px, 3.6vw, 50px)', fontWeight: 800, color: 'var(--tx)', margin: '16px 0 0', lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            Ce spun elevii<br />și părinții
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center' }} className="tst-row">
          <button onClick={() => go(idx - 1)} aria-label="Anterior" className="tst-arrow">
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </button>

          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div key={idx}
                initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.35, ease }}
                style={{ border: '1px solid var(--line)', padding: '40px 40px', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
                  <img src={t.avatar} alt={t.name} className="ph" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: '50%' }} />
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--tx)', margin: '0 0 3px' }}>{t.name}</p>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sand-deep)', margin: 0 }}>{t.role}</p>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--orange)', fontSize: 13, letterSpacing: 2 }}>★★★★★</span>
                </div>
                <p style={{ fontSize: 17, color: 'var(--tx)', lineHeight: 1.75, fontStyle: 'italic', margin: 0, fontFamily: 'var(--font-playfair), serif' }}>
                  „{t.text}”
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <button onClick={() => go(idx + 1)} aria-label="Următor" className="tst-arrow">
            <ArrowRight style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
          {data.map((_, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`Testimonial ${i + 1}`}
              style={{ height: 2, border: 'none', cursor: 'pointer', transition: 'all 0.3s', background: i === idx ? 'var(--orange)' : 'var(--line-strong)', width: i === idx ? 28 : 14 }} />
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
