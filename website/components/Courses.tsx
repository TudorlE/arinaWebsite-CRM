'use client';
import { motion } from 'framer-motion';

const courses = [
  {
    emoji: '🎹', title: 'Pian', accent: '#FFD54A',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&q=80&fit=crop',
    desc: 'De la primele note la piese complexe. Cursuri pentru toate vârstele, de la 5 ani. Metodă Suzuki și clasică.',
    tags: ['Începători', 'Avansați', '5+ ani'],
  },
  {
    emoji: '🥁', title: 'Tobe', accent: '#FF8A50',
    image: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600&q=80&fit=crop',
    desc: 'Ritmul e inima muzicii. Baterie și percuție, de la fundamente la stiluri pop, rock și jazz.',
    tags: ['Ritm', 'Baterie', '7+ ani'],
  },
  {
    emoji: '🎤', title: 'Canto', accent: '#FF6EC7',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=80&fit=crop',
    desc: 'Vocea ta e instrumentul cel mai personal. Tehnici vocale profesionale, respirație și repertoriu clasic.',
    tags: ['Voce', 'Tehnică', '6+ ani'],
  },
  {
    emoji: '🎼', title: 'Solfegiu', accent: '#A78BFA',
    image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80&fit=crop',
    desc: 'Teoria care îți deschide orizonturile muzicale. Citire note, dicteu muzical, armonie și compoziție.',
    tags: ['Teorie', 'Note', 'Armonie'],
  },
  {
    emoji: '🎸', title: 'Chitară', accent: '#4ADE80',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80&fit=crop',
    desc: 'Chitara acustică sau electrică — de la acorduri simple la riff-uri complexe. Stiluri folk, rock, clasic.',
    tags: ['Acustică', 'Electrică', '6+ ani'],
  },
];

export default function Courses() {
  return (
    <section id="cursuri" style={{ padding: '120px 24px', background: 'var(--ink)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 72 }}>
          <span className="eyebrow" style={{ justifyContent: 'center', marginBottom: 20 }}>Cursuri</span>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 56px)', fontWeight: 900, color: '#fff', margin: '16px 0 18px', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
            Alege instrumentul tău
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Fiecare instrument are propria poveste. Care va fi a ta?
          </p>
        </motion.div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }} className="courses-grid">
          {courses.map((c, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: 'var(--ink)' }}
            >
              {/* Image */}
              <div style={{ position: 'relative', overflow: 'hidden', height: 210 }} className="img-hover-zoom">
                <img src={c.image} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,11,0.92) 0%, rgba(10,10,11,0.15) 55%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 18, left: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 26 }}>{c.emoji}</span>
                  <h3 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: 0 }}>{c.title}</h3>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '22px 24px 26px' }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 18px' }}>{c.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
                  {c.tags.map(t => (
                    <span key={t} style={{
                      padding: '4px 10px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                      color: c.accent, border: `1px solid ${c.accent}44`,
                    }}>{t}</span>
                  ))}
                </div>
                <button onClick={() => document.querySelector('#inscriere')?.scrollIntoView({ behavior: 'smooth' })} className="link-cta" style={{ fontSize: 12 }}>
                  Înscrie-te la {c.title} <span className="arrow">→</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`
        .img-hover-zoom:hover img { transform: scale(1.06); }
        @media (max-width: 1024px) { .courses-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px)  { .courses-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
