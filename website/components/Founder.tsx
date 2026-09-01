'use client';
import { motion } from 'framer-motion';

export default function Founder() {
  return (
    <section id="fondator" style={{ padding: '120px 24px', background: 'var(--ink-raised)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 88, alignItems: 'center' }} className="founder-grid">

        {/* Text */}
        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <span className="eyebrow" style={{ marginBottom: 24 }}>Fondatoarea Școlii</span>
          <h2 style={{ fontSize: 'clamp(42px, 5vw, 72px)', fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '20px 0 4px' }}>Arina</h2>
          <h2 style={{ fontSize: 'clamp(42px, 5vw, 72px)', fontWeight: 900, color: 'var(--orange)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 36px' }}>Bădulescu</h2>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.82, margin: '0 0 16px' }}>
            Arina a crescut înconjurată de muzică. De la primele lecții de pian la vârsta de 5 ani și până la studii superioare la Conservator, muzica a fost întotdeauna centrul vieții sale.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.82, margin: '0 0 16px' }}>
            Arry Production s-a născut din dorința de a crea un spațiu în care fiecare copil și adult să aibă ocazia să-și descopere și să-și dezvolte talentul muzical.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.82, margin: '0 0 44px' }}>
            Cu peste un deceniu de experiență în educație muzicală, Arina a construit o echipă de profesori pasionați care cred că muzica este un drept al oricărei ființe umane.
          </p>

          {/* Quote */}
          <motion.blockquote initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.25 }}
            style={{ borderLeft: '2px solid var(--orange)', paddingLeft: 24, margin: 0 }}>
            <p style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', lineHeight: 1.65, margin: '0 0 18px' }}>
              &ldquo;Cred că fiecare copil are un talent care merită descoperit. Muzica este cheia care deschide uși pe care nici nu știai că există.&rdquo;
            </p>
            <div>
              <p style={{ fontWeight: 900, fontSize: 14.5, color: '#fff', margin: '0 0 4px' }}>Arina Bădulescu</p>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(255,90,31,0.85)', margin: 0 }}>Fondatoare & Director Artistic, Arry Production</p>
            </div>
          </motion.blockquote>
        </motion.div>

        {/* Image */}
        <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative' }}>
          <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid var(--line)' }} className="img-hover-zoom">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&q=85&fit=crop&crop=face" alt="Arina Bădulescu" style={{ width: '100%', height: 590, objectFit: 'cover', objectPosition: 'top', display: 'block', transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
          </div>
        </motion.div>
      </div>
      <style>{`
        .img-hover-zoom:hover img { transform: scale(1.04); }
        @media (max-width: 900px) { .founder-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
