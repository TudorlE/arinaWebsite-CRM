'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BLACK, OFFWHITE, LIME, display, body } from './theme';

const imgs = [
  { src: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80&fit=crop', alt: 'Concert', h: 300 },
  { src: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&q=80&fit=crop', alt: 'Lecție pian', h: 210 },
  { src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop', alt: 'Elevi', h: 260 },
  { src: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80&fit=crop', alt: 'Chitară', h: 210 },
  { src: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=80&fit=crop', alt: 'Canto', h: 300 },
  { src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80&fit=crop', alt: 'Recital', h: 260 },
  { src: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600&q=80&fit=crop', alt: 'Tobe', h: 230 },
  { src: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80&fit=crop', alt: 'Solfegiu', h: 210 },
  { src: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80&fit=crop', alt: 'Performanță', h: 280 },
];

export default function Gallery() {
  const [lb, setLb] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const prev = () => setLb(i => i !== null ? (i - 1 + imgs.length) % imgs.length : null);
  const next = () => setLb(i => i !== null ? (i + 1) % imgs.length : null);

  const col1 = imgs.filter((_, i) => i % 3 === 0);
  const col2 = imgs.filter((_, i) => i % 3 === 1);
  const col3 = imgs.filter((_, i) => i % 3 === 2);

  const renderCol = (col: typeof imgs, offset: number) => col.map((img, ci) => {
    const idx = ci * 3 + offset;
    return (
      <motion.div key={ci} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: ci * 0.08, duration: 0.5 }}
        onClick={() => setLb(idx)} onMouseEnter={() => setHover(idx)} onMouseLeave={() => setHover(null)}
        style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', marginBottom: 16, height: img.h }}>
        <img src={img.src} alt={img.alt} style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease, filter 0.3s',
          transform: hover === idx ? 'scale(1.05)' : 'scale(1)',
          filter: hover === idx ? 'grayscale(0) contrast(1.1)' : 'grayscale(0.55) contrast(1.05)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(2,7,7,0.75), transparent 55%)', opacity: hover === idx ? 1 : 0, transition: 'opacity 0.25s' }} />
        <span style={{
          position: 'absolute', bottom: 14, left: 14, color: LIME, fontWeight: 700, fontSize: 11, fontFamily: body,
          letterSpacing: '0.08em', textTransform: 'uppercase', opacity: hover === idx ? 1 : 0, transition: 'opacity 0.25s',
        }}>{img.alt}</span>
      </motion.div>
    );
  });

  return (
    <section id="galerie" style={{ padding: '120px 24px', background: OFFWHITE }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ marginBottom: 64 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: body, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20, color: BLACK }}>
            <span style={{ width: 24, height: 1, background: BLACK, display: 'inline-block' }} /> Galerie
          </span>
          <h2 style={{ fontFamily: display, fontSize: 'clamp(40px, 5.5vw, 80px)', color: BLACK, margin: 0, lineHeight: 0.92, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>Momente muzicale</h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="gallery-grid">
          <div>{renderCol(col1, 0)}</div>
          <div style={{ marginTop: 36 }}>{renderCol(col2, 1)}</div>
          <div>{renderCol(col3, 2)}</div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lb !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(2,7,7,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setLb(null)}>
            <motion.div initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
              style={{ position: 'relative', maxWidth: 900, width: '100%' }} onClick={e => e.stopPropagation()}>
              <img src={imgs[lb].src.replace('w=600', 'w=1200')} alt={imgs[lb].alt} style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
              <button onClick={() => setLb(null)} style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, background: LIME, color: BLACK, border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              <button onClick={prev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, background: 'rgba(244,243,237,0.1)', color: OFFWHITE, border: 'none', cursor: 'pointer', fontSize: 20 }}>‹</button>
              <button onClick={next} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, background: 'rgba(244,243,237,0.1)', color: OFFWHITE, border: 'none', cursor: 'pointer', fontSize: 20 }}>›</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@media (max-width: 768px) { .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; } } @media (max-width: 480px) { .gallery-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
