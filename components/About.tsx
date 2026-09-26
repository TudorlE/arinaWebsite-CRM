'use client';
import { motion } from 'framer-motion';
import { Reveal, RevealLines, Stagger, StaggerItem, Parallax, EASE } from '@/components/motionx';
import { useLocale } from '@/lib/i18n';

const SandCard = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <motion.div whileHover={{ y: -6, scale: 1.015 }} transition={{ duration: 0.35, ease: EASE }} style={{
    background: 'linear-gradient(160deg, var(--sand) 0%, var(--sand-deep) 100%)',
    color: 'var(--sand-ink)', padding: '26px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    ...style,
  }}>
    {children}
  </motion.div>
);

const kicker: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55 };
const cardTitle: React.CSSProperties = { fontFamily: 'var(--font-playfair), serif', fontWeight: 700, lineHeight: 1.28, margin: '14px 0 0' };

export default function About() {
  const { t } = useLocale();
  const a = t.about;
  const lines = a.lines.map((ln, i) => (i === a.highlightIndex ? <span key={i} style={{ color: 'var(--sand)' }}>{ln}</span> : ln));

  return (
    <section id="despre" style={{ background: 'var(--bg)', padding: 'clamp(64px, 9vh, 104px) 32px', position: 'relative' }}>
      <hr className="rule" style={{ maxWidth: 1240, margin: '0 auto 54px' }} />
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 40, alignItems: 'end', marginBottom: 56 }} className="about-head">
          <div>
            <Reveal><span className="eyebrow" style={{ marginBottom: 24, display: 'inline-flex' }}>{a.eyebrow}</span></Reveal>
            <RevealLines
              style={{ fontSize: 'clamp(23px, 5.4vw, 52px)', lineHeight: 1.16, letterSpacing: '-0.02em', textTransform: 'uppercase', fontWeight: 800, color: 'var(--tx)', marginTop: 18 }}
              lines={lines}
            />
          </div>
          <Reveal delay={0.15}>
            <p style={{ fontSize: 15, color: 'var(--tx-mut)', lineHeight: 1.8, margin: 0, maxWidth: 380 }}>
              {a.desc}
            </p>
          </Reveal>
        </div>

        <Stagger className="mosaic">
          <StaggerItem style={{ gridArea: 'a' }} className="ph-wrap">
            <Parallax distance={22} style={{ height: '100%', minHeight: 300 }}>
              <img src="/about-direction.jpg" alt={a.imgAltA} className="ph" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Parallax>
          </StaggerItem>

          <StaggerItem style={{ gridArea: 'b' }} className="ph-wrap">
            <Parallax distance={22} style={{ height: '100%', minHeight: 200 }}>
              <img src="/about-guitar.jpg" alt={a.imgAltB} className="ph" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Parallax>
          </StaggerItem>

          <StaggerItem style={{ gridArea: 'c' }}>
            <SandCard style={{ height: '100%' }}>
              <span style={kicker}>{a.cardC.kicker}</span>
              <p style={{ ...cardTitle, fontSize: 17 }}>{a.cardC.title}</p>
            </SandCard>
          </StaggerItem>

          <StaggerItem style={{ gridArea: 'd' }} className="ph-wrap">
            <Parallax distance={22} style={{ height: '100%', minHeight: 200 }}>
              <img src="/about-guitar-girl.jpg" alt={a.imgAltD} className="ph" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Parallax>
          </StaggerItem>

          <StaggerItem style={{ gridArea: 'e' }} className="ph-wrap">
            <Parallax distance={26} style={{ height: '100%', minHeight: 220 }}>
              <img src="/about-stage.jpg" alt={a.imgAltE} className="ph" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Parallax>
          </StaggerItem>
        </Stagger>
      </div>

      <style>{`
        .mosaic {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: minmax(190px, auto);
          grid-template-areas: "a b c" "a d e";
          gap: 14px;
        }
        @media (max-width: 860px) {
          .about-head { grid-template-columns: 1fr !important; }
          .mosaic { grid-template-columns: 1fr 1fr; grid-auto-rows: minmax(170px, auto); grid-template-areas: "a a" "b c" "d e"; }
        }
        @media (max-width: 520px) {
          .mosaic { grid-template-columns: 1fr; grid-auto-rows: auto; grid-template-areas: "a" "b" "c" "d" "e"; }
        }
      `}</style>
    </section>
  );
}
