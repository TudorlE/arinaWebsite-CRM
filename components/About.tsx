'use client';
import { Reveal, RevealLines } from '@/components/motionx';
import { useLocale } from '@/lib/i18n';

export default function About() {
  const { t } = useLocale();
  const a = t.about;
  const lines = a.lines.map((ln, i) => (i === a.highlightIndex ? <span key={i} style={{ color: 'var(--sand)' }}>{ln}</span> : ln));

  return (
    <section id="despre" style={{ background: 'var(--bg)', padding: 'clamp(64px, 9vh, 104px) 32px', position: 'relative' }}>
      <hr className="rule" style={{ maxWidth: 1240, margin: '0 auto 54px' }} />
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 40, alignItems: 'end' }} className="about-head">
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
      </div>

      <style>{`
        @media (max-width: 860px) {
          .about-head { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
