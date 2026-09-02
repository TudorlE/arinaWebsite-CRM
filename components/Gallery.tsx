'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const imgs = [
  { src: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80&fit=crop', alt: 'Concert', h: 280 },
  { src: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&q=80&fit=crop', alt: 'Lecție pian', h: 200 },
  { src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop', alt: 'Elevi', h: 240 },
  { src: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80&fit=crop', alt: 'Chitară', h: 200 },
  { src: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=80&fit=crop', alt: 'Canto', h: 280 },
  { src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80&fit=crop', alt: 'Recital', h: 240 },
  { src: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600&q=80&fit=crop', alt: 'Tobe', h: 220 },
  { src: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80&fit=crop', alt: 'Solfegiu', h: 200 },
  { src: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80&fit=crop', alt: 'Performanță', h: 260 },
];

export default function Gallery() {
  const [lb, setLb] = useState<number | null>(null);

  const prev = () => setLb(i => i !== null ? (i - 1 + imgs.length) % imgs.length : null);
  const next = () => setLb(i => i !== null ? (i + 1) % imgs.length : null);

  const col1 = imgs.filter((_, i) => i % 3 === 0);
  const col2 = imgs.filter((_, i) => i % 3 === 1);
  const col3 = imgs.filter((_, i) => i % 3 === 2);

  const renderCol = (col: typeof imgs, offset: number) => col.map((img, ci) => {
    const idx = ci * 3 + offset;
    return (
      <motion.div key={ci} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: ci * 0.08, duration: 0.5 }}
        onClick={() => setLb(idx)}
        className="img-hover-zoom"
        style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', marginBottom: 16, height: img.h, border: '1px solid var(--line)' }}>
        <img src={img.src} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
        <div className="gallery-caption" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,11,0.75), transparent 60%)', opacity: 0, transition: 'opacity 0.3s' }}>
          <span style={{ position: 'absolute', bottom: 12, left: 16, color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{img.alt}</span>
        </div>
      </motion.div>
    );
  });

  return (
    <section id="galerie" style={{ padding: '120px 24px', background: 'var(--ink)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: 68 }}>
          <span className="eyebrow" style={{ justifyContent: 'center', marginBottom: 20 }}>Galerie</span>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 56px)', fontWeight: 900, color: '#fff', margin: '16px 0 18px', lineHeight: 1.08, letterSpacing: '-0.025em' }}>Momente muzicale</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.42)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>Fiecare imagine surprinde o poveste. Acesta este universul Arry Production.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="gallery-grid">
          <div>{renderCol(col1, 0)}</div>
          <div style={{ marginTop: 32 }}>{renderCol(col2, 1)}</div>
          <div>{renderCol(col3, 2)}</div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lb !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5,5,6,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setLb(null)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.25 }}
              style={{ position: 'relative', maxWidth: 900, width: '100%' }} onClick={e => e.stopPropagation()}>
              <img src={imgs[lb].src.replace('w=600', 'w=1200')} alt={imgs[lb].alt} style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block', border: '1px solid var(--line)' }} />
              <button onClick={() => setLb(null)} style={{ position: 'absolute', top: 12, right: 12, width: 38, height: 38, border: '1px solid var(--line-strong)', background: 'rgba(10,10,11,0.7)', color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              <button onClick={prev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, border: '1px solid var(--line-strong)', background: 'rgba(10,10,11,0.7)', color: '#fff', cursor: 'pointer', fontSize: 18 }}>‹</button>
              <button onClick={next} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, border: '1px solid var(--line-strong)', background: 'rgba(10,10,11,0.7)', color: '#fff', cursor: 'pointer', fontSize: 18 }}>›</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .img-hover-zoom:hover img { transform: scale(1.06); }
        .img-hover-zoom:hover .gallery-caption { opacity: 1; }
        @media (max-width: 768px) { .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; } } @media (max-width: 480px) { .gallery-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
