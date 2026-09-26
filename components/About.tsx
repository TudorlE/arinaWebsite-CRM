'use client';
import { Reveal, RevealLines, Stagger, StaggerItem, Parallax } from '@/components/motionx';
import { useLocale } from '@/lib/i18n';

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

          <StaggerItem style={{ gridArea: 'c' }} className="ph-wrap">
            <Parallax distance={22} style={{ height: '100%', minHeight: 200 }}>
              <img src="/about-scena.jpg" alt={a.imgAltC} className="ph" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Parallax>
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
