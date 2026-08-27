'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BLACK, OFFWHITE, LIME, HAIRLINE_ON_BLACK, display, body } from './theme';

const data = [
  { name: 'Maria Ionescu', role: 'Mamă a unui elev de pian', text: 'Fiul meu are 8 ani și în 6 luni de la Arry Production a progresat incredibil. Nu îl mai poți scoate de la pian! Profesorii sunt răbdători și plini de entuziasm.' },
  { name: 'Alexandru Popa', role: 'Elev de tobe, 16 ani', text: 'Am venit fără nicio experiență și acum cânt în trupa școlii. Atmosfera de aici este de neegalat — simți că muzica curge prin sălile de curs.' },
  { name: 'Elena Dragomir', role: 'Elevă de canto, 24 ani', text: 'Visam să cânt de mică. La Arry Production mi-am găsit vocea și mai mult decât atât — mi-am găsit comunitatea. Profesorul meu m-a ajutat să depășesc emoțiile scenice.' },
  { name: 'Radu Constantin', role: 'Tată a două eleve', text: 'Ambele fiice ale mele sunt la Arry Production de 2 ani. Rezultatele sunt vizibile, iar recitalurile de final de an sunt emoționante. Recomand cu căldură!' },
  { name: 'Cristina Marin', role: 'Elevă de pian, 30 ani', text: 'Niciodată nu e prea târziu să înveți muzică! La 30 de ani am început pianul de la zero și acum cânt piese pe care le admiram la alții.' },
];

export default function Testimonials() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (i: number) => { setDir(i > idx ? 1 : -1); setIdx(i); };

  return (
    <section style={{ padding: '120px 24px', background: BLACK, overflow: 'hidden' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: body, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20, color: LIME, justifyContent: 'center' }}>
            Testimoniale
          </span>
          <h2 style={{ fontFamily: display, fontSize: 'clamp(36px, 5vw, 68px)', color: OFFWHITE, margin: 0, lineHeight: 0.94, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
            Ce spun elevii
          </h2>
        </motion.div>

        <div style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${HAIRLINE_ON_BLACK}` }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={idx} custom={dir}
              initial={{ opacity: 0, x: dir * 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -50 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{ padding: '56px 48px', textAlign: 'center' }}>
              <div style={{ fontFamily: display, fontSize: 64, lineHeight: 0.6, color: LIME, marginBottom: 24, userSelect: 'none' }}>&ldquo;</div>
              <p style={{ fontFamily: body, fontSize: 19, color: 'rgba(244,243,237,0.85)', lineHeight: 1.7, fontStyle: 'italic', maxWidth: 580, margin: '0 auto 36px' }}>
                {data[idx].text}
              </p>
              <p style={{ fontFamily: body, fontWeight: 800, fontSize: 15, color: OFFWHITE, margin: '0 0 4px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{data[idx].name}</p>
              <p style={{ fontFamily: body, fontSize: 12, fontWeight: 600, color: LIME, margin: 0 }}>{data[idx].role}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 32 }}>
          <button onClick={() => go((idx - 1 + data.length) % data.length)}
            style={{ width: 40, height: 40, background: 'transparent', border: `1px solid ${HAIRLINE_ON_BLACK}`, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: OFFWHITE }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = LIME; (e.currentTarget as HTMLElement).style.color = LIME; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = HAIRLINE_ON_BLACK; (e.currentTarget as HTMLElement).style.color = OFFWHITE; }}>‹</button>
          <div style={{ display: 'flex', gap: 6 }}>
            {data.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                style={{ height: 6, border: 'none', cursor: 'pointer', transition: 'all 0.25s', background: i === idx ? LIME : 'rgba(244,243,237,0.2)', width: i === idx ? 26 : 6 }} />
            ))}
          </div>
          <button onClick={() => go((idx + 1) % data.length)}
            style={{ width: 40, height: 40, background: 'transparent', border: `1px solid ${HAIRLINE_ON_BLACK}`, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: OFFWHITE }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = LIME; (e.currentTarget as HTMLElement).style.color = LIME; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = HAIRLINE_ON_BLACK; (e.currentTarget as HTMLElement).style.color = OFFWHITE; }}>›</button>
        </div>
      </div>
    </section>
  );
}
