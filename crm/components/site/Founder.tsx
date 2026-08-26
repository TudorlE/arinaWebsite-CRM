'use client';
import { motion } from 'framer-motion';

export default function Founder() {
  return (
    <section id="fondator" style={{ padding: '120px 24px', background: 'linear-gradient(180deg, #100A06 0%, #140C08 50%, #100A06 100%)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 88, alignItems: 'center' }} className="founder-grid">

        {/* Text */}
        <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <span style={{ display: 'inline-block', padding: '7px 18px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24, background: 'rgba(201,123,94,0.1)', color: '#C97B5E', border: '1px solid rgba(201,123,94,0.2)' }}>
            Fondatoarea Școlii
          </span>
          <h2 style={{ fontSize: 'clamp(42px, 5vw, 72px)', fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 4px' }}>Arina</h2>
          <h2 style={{ fontSize: 'clamp(42px, 5vw, 72px)', fontWeight: 900, color: '#F4A85C', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 36px', textShadow: '0 0 40px rgba(244,168,92,0.25)' }}>Bădulescu</h2>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.82, margin: '0 0 16px' }}>
            Arina a crescut înconjurată de muzică. De la primele lecții de pian la vârsta de 5 ani și până la studii superioare la Conservator, muzica a fost întotdeauna centrul vieții sale.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.82, margin: '0 0 16px' }}>
            Arry Production s-a născut din dorința de a crea un spațiu în care fiecare copil și adult să aibă ocazia să-și descopere și să-și dezvolte talentul muzical.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.82, margin: '0 0 44px' }}>
            Cu peste un deceniu de experiență în educație muzicală, Arina a construit o echipă de profesori pasionați care cred că muzica este un drept al oricărei ființe umane.
          </p>

          {/* Quote */}
          <motion.blockquote initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            style={{ borderLeft: '3px solid #F4A85C', paddingLeft: 24, margin: 0, borderRadius: '0 0 0 4px' }}>
            <p style={{ fontSize: 19, fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', lineHeight: 1.65, margin: '0 0 18px' }}>
              "Cred că fiecare copil are un talent care merită descoperit. Muzica este cheia care deschide uși pe care nici nu știai că există."
            </p>
            <div>
              <p style={{ fontWeight: 900, fontSize: 15, color: '#fff', margin: '0 0 4px' }}>Arina Bădulescu</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(244,168,92,0.7)', margin: 0 }}>Fondatoare & Director Artistic, Arry Production</p>
            </div>
          </motion.blockquote>
        </motion.div>

        {/* Image */}
        <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative' }}>
          {/* Ambient glow */}
          <div style={{ position: 'absolute', inset: -30, background: 'radial-gradient(ellipse, rgba(201,123,94,0.15) 0%, rgba(244,168,92,0.08) 50%, transparent 70%)', borderRadius: 40, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, borderRadius: 28, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}>
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&q=85&fit=crop&crop=face" alt="Arina Bădulescu" style={{ width: '100%', height: 590, objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(16,10,6,0.65) 0%, transparent 50%)' }} />
          </div>
          <span className="fa" style={{ position: 'absolute', top: -36, right: -28, fontSize: 80, opacity: 0.1, zIndex: 2, userSelect: 'none', color: '#F4A85C', filter: 'drop-shadow(0 0 16px rgba(244,168,92,0.4))' }}>♫</span>
          <span className="fb" style={{ position: 'absolute', bottom: -20, left: -24, fontSize: 60, opacity: 0.09, zIndex: 2, userSelect: 'none', color: '#C97B5E' }}>♩</span>
        </motion.div>
      </div>
      <style>{`@media (max-width: 900px) { .founder-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
