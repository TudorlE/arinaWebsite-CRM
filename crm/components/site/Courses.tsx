'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { BLACK, OFFWHITE, LIME, HAIRLINE_ON_BLACK, display, body } from './theme';

const courses = [
  { n: '01', title: 'Pian', image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=700&q=80&fit=crop', desc: 'De la primele note la piese complexe. Metodă Suzuki și clasică, de la 5 ani.', tags: ['Începători', 'Avansați', '5+ ani'] },
  { n: '02', title: 'Tobe', image: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=700&q=80&fit=crop', desc: 'Ritmul e inima muzicii. Fundamente și stiluri pop, rock, jazz.', tags: ['Ritm', 'Baterie', '7+ ani'] },
  { n: '03', title: 'Canto', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=700&q=80&fit=crop', desc: 'Vocea ta e instrumentul cel mai personal. Tehnică, respirație, repertoriu.', tags: ['Voce', 'Tehnică', '6+ ani'] },
  { n: '04', title: 'Solfegiu', image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=700&q=80&fit=crop', desc: 'Teoria care îți deschide orizonturile. Citire note, dicteu, armonie.', tags: ['Teorie', 'Note', 'Armonie'] },
  { n: '05', title: 'Chitară', image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=700&q=80&fit=crop', desc: 'Acustică sau electrică — de la acorduri la riff-uri complexe.', tags: ['Acustică', 'Electrică', '6+ ani'] },
];

export default function Courses() {
  const [hover, setHover] = useState<number | null>(null);
  const go = () => document.querySelector('#inscriere')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="cursuri" style={{ padding: '120px 24px', background: BLACK, position: 'relative' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          style={{ marginBottom: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: body, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16, color: LIME }}>
              <span style={{ width: 24, height: 1, background: LIME, display: 'inline-block' }} /> Cursuri
            </span>
            <h2 style={{ fontFamily: display, fontSize: 'clamp(40px, 6vw, 88px)', color: OFFWHITE, margin: 0, lineHeight: 0.92, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
              Alege<br />instrumentul
            </h2>
          </div>
          <p style={{ fontFamily: body, fontSize: 16, color: 'rgba(244,243,237,0.45)', maxWidth: 320, margin: 0, lineHeight: 1.6 }}>
            Fiecare instrument are propria poveste. Care va fi a ta?
          </p>
        </motion.div>

        {/* Editorial list */}
        <div style={{ borderTop: `1px solid ${HAIRLINE_ON_BLACK}`, position: 'relative' }}>
          {courses.map((c, i) => (
            <motion.div key={c.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              onClick={go}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
                padding: '30px 8px', borderBottom: `1px solid ${HAIRLINE_ON_BLACK}`,
                cursor: 'pointer', position: 'relative', transition: 'padding-left 0.25s ease',
                paddingLeft: hover === i ? 28 : 8,
              }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, minWidth: 0 }}>
                <span style={{ fontFamily: body, fontSize: 14, fontWeight: 700, color: hover === i ? LIME : 'rgba(244,243,237,0.35)', transition: 'color 0.2s', flexShrink: 0 }}>{c.n}</span>
                <span style={{
                  fontFamily: display, fontSize: 'clamp(32px, 5.5vw, 64px)', letterSpacing: '-0.01em', lineHeight: 1,
                  color: hover === i ? LIME : OFFWHITE, transition: 'color 0.2s', textTransform: 'uppercase',
                }}>{c.title}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }} className="course-tags">
                {c.tags.map(t => (
                  <span key={t} style={{ fontFamily: body, fontSize: 11, fontWeight: 700, color: 'rgba(244,243,237,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t}</span>
                ))}
                <ArrowUpRight style={{
                  width: 28, height: 28, color: hover === i ? LIME : 'rgba(244,243,237,0.3)',
                  transform: hover === i ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'all 0.25s',
                }} />
              </div>

              {/* Hover image reveal (desktop only) */}
              <motion.div
                initial={false}
                animate={{ opacity: hover === i ? 1 : 0, scale: hover === i ? 1 : 0.94 }}
                transition={{ duration: 0.25 }}
                style={{
                  position: 'absolute', right: 40, top: '50%', translate: '0 -50%', width: 220, height: 150,
                  overflow: 'hidden', pointerEvents: 'none', zIndex: 5, display: hover === null ? 'none' : 'block',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                }}
                className="hide-mobile-img">
                <img src={c.image} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.2) contrast(1.1)' }} />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .course-tags span { display: none !important; } .hide-mobile-img { display: none !important; } }
      `}</style>
    </section>
  );
}
