'use client';
import { motion } from 'framer-motion';
import { BLACK, OFFWHITE, LIME, HAIRLINE_ON_BLACK, display, body } from './theme';

export default function Founder() {
  return (
    <section id="fondator" style={{ padding: '120px 24px', background: BLACK }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }} className="founder-grid">

        {/* Image */}
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', order: 1 }} className="founder-img">
          <div style={{ overflow: 'hidden' }}>
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&q=85&fit=crop&crop=face" alt="Arina Bădulescu"
              style={{ width: '100%', height: 620, objectFit: 'cover', objectPosition: 'top', display: 'block', filter: 'grayscale(0.4) contrast(1.1)' }} />
          </div>
          <div style={{ position: 'absolute', top: -1, left: -1, background: LIME, padding: '10px 18px' }}>
            <span style={{ fontFamily: body, fontSize: 11, fontWeight: 800, color: BLACK, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Director Artistic</span>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ order: 2 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: body, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20, color: LIME }}>
            <span style={{ width: 24, height: 1, background: LIME, display: 'inline-block' }} /> Fondatoarea Școlii
          </span>
          <h2 style={{ fontFamily: display, fontSize: 'clamp(48px, 7vw, 108px)', color: OFFWHITE, lineHeight: 0.85, letterSpacing: '-0.01em', margin: '0 0 40px', textTransform: 'uppercase' }}>
            Arina<br /><span style={{ color: LIME }}>Bădulescu</span>
          </h2>

          <p style={{ fontFamily: body, fontSize: 16, color: 'rgba(244,243,237,0.6)', lineHeight: 1.7, margin: '0 0 16px', maxWidth: 460 }}>
            Arina a crescut înconjurată de muzică. De la primele lecții de pian la vârsta de 5 ani și până la studii superioare la Conservator, muzica a fost întotdeauna centrul vieții sale.
          </p>
          <p style={{ fontFamily: body, fontSize: 16, color: 'rgba(244,243,237,0.6)', lineHeight: 1.7, margin: '0 0 44px', maxWidth: 460 }}>
            Arry Production s-a născut din dorința de a crea un spațiu în care fiecare copil și adult să aibă ocazia să-și descopere talentul muzical.
          </p>

          <blockquote style={{ borderLeft: `2px solid ${LIME}`, paddingLeft: 24, margin: 0 }}>
            <p style={{ fontFamily: body, fontSize: 18, fontWeight: 500, color: OFFWHITE, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 16px' }}>
              &ldquo;Cred că fiecare copil are un talent care merită descoperit. Muzica este cheia care deschide uși pe care nici nu știai că există.&rdquo;
            </p>
            <p style={{ fontFamily: body, fontWeight: 800, fontSize: 14, color: OFFWHITE, margin: '0 0 4px', letterSpacing: '0.02em' }}>Arina Bădulescu</p>
            <p style={{ fontFamily: body, fontSize: 12, fontWeight: 600, color: LIME, margin: 0 }}>Fondatoare & Director Artistic</p>
          </blockquote>
        </motion.div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .founder-grid { grid-template-columns: 1fr !important; }
          .founder-img { order: 1 !important; }
        }
      `}</style>
    </section>
  );
}
