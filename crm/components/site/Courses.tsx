'use client';
import { motion } from 'framer-motion';

const courses = [
  {
    emoji: '🎹', title: 'Pian', accent: '#F4A85C', glow: 'rgba(244,168,92,0.18)',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&q=80&fit=crop',
    desc: 'De la primele note la piese complexe. Cursuri pentru toate vârstele, de la 5 ani. Metodă Suzuki și clasică.',
    tags: ['Începători', 'Avansați', '5+ ani'],
  },
  {
    emoji: '🥁', title: 'Tobe', accent: '#FF8A50', glow: 'rgba(255,138,80,0.18)',
    image: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600&q=80&fit=crop',
    desc: 'Ritmul e inima muzicii. Baterie și percuție, de la fundamente la stiluri pop, rock și jazz.',
    tags: ['Ritm', 'Baterie', '7+ ani'],
  },
  {
    emoji: '🎤', title: 'Canto', accent: '#FF6EC7', glow: 'rgba(255,110,199,0.18)',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=80&fit=crop',
    desc: 'Vocea ta e instrumentul cel mai personal. Tehnici vocale profesionale, respirație și repertoriu clasic.',
    tags: ['Voce', 'Tehnică', '6+ ani'],
  },
  {
    emoji: '🎼', title: 'Solfegiu', accent: '#C97B5E', glow: 'rgba(201,123,94,0.18)',
    image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80&fit=crop',
    desc: 'Teoria care îți deschide orizonturile muzicale. Citire note, dicteu muzical, armonie și compoziție.',
    tags: ['Teorie', 'Note', 'Armonie'],
  },
  {
    emoji: '🎸', title: 'Chitară', accent: '#4ADE80', glow: 'rgba(74,222,128,0.16)',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80&fit=crop',
    desc: 'Chitara acustică sau electrică — de la acorduri simple la riff-uri complexe. Stiluri folk, rock, clasic.',
    tags: ['Acustică', 'Electrică', '6+ ani'],
  },
];

export default function Courses() {
  return (
    <section id="cursuri" style={{ padding: '120px 24px', background: 'linear-gradient(180deg, #0D0905 0%, #100A06 50%, #0D0905 100%)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 72 }}>
          <span style={{ display: 'inline-block', padding: '7px 18px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20, background: 'rgba(244,168,92,0.1)', color: '#F4A85C', border: '1px solid rgba(244,168,92,0.2)' }}>
            Cursuri
          </span>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 56px)', fontWeight: 900, color: '#fff', margin: '0 0 18px', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
            Alege instrumentul tău
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Fiecare instrument are propria poveste. Care va fi a ta?
          </p>
        </motion.div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="courses-grid">
          {courses.map((c, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 44 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                borderRadius: 24, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.07)',
                transition: 'border-color 0.35s, box-shadow 0.35s',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = c.accent + '55';
                el.style.boxShadow = `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${c.glow}`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'rgba(255,255,255,0.07)';
                el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
              }}>
              {/* Image */}
              <div style={{ position: 'relative', overflow: 'hidden', height: 210 }}>
                <img src={c.image} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.55s ease', display: 'block' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'scale(1.08)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)'; }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,9,5,0.92) 0%, rgba(13,9,5,0.2) 55%, transparent 100%)' }} />
                {/* Color accent glow overlay */}
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top right, ${c.glow} 0%, transparent 60%)`, mixBlendMode: 'screen' }} />
                <div style={{ position: 'absolute', bottom: 18, left: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 30, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}>{c.emoji}</span>
                  <h3 style={{ color: '#fff', fontWeight: 900, fontSize: 24, margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{c.title}</h3>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '22px 24px 26px' }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 18px' }}>{c.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
                  {c.tags.map(t => (
                    <span key={t} style={{
                      padding: '4px 12px', borderRadius: 99, fontSize: 11.5, fontWeight: 700,
                      background: 'rgba(255,255,255,0.06)',
                      color: c.accent,
                      border: `1px solid ${c.accent}33`,
                    }}>{t}</span>
                  ))}
                </div>
                <button onClick={() => document.querySelector('#inscriere')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ width: '100%', padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 700, background: `linear-gradient(135deg, ${c.accent}22, ${c.accent}44)`, color: c.accent, border: `1px solid ${c.accent}44`, cursor: 'pointer', transition: 'all 0.25s' }}
                  onMouseEnter={e => { const el = e.target as HTMLElement; el.style.background = c.accent; el.style.color = '#0d0a00'; el.style.boxShadow = `0 6px 24px ${c.glow}`; }}
                  onMouseLeave={e => { const el = e.target as HTMLElement; el.style.background = `${c.accent}22`; el.style.color = c.accent; el.style.boxShadow = 'none'; }}>
                  Înscrie-te la {c.title} →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { .courses-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px)  { .courses-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
