'use client';
import { Reveal, RevealLines, Stagger, StaggerItem, Parallax } from '@/components/motionx';

const SandCard = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: 'linear-gradient(160deg, var(--sand) 0%, var(--sand-deep) 100%)',
    color: 'var(--sand-ink)', padding: '26px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    ...style,
  }}>
    {children}
  </div>
);

const kicker: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55 };
const cardTitle: React.CSSProperties = { fontFamily: 'var(--font-playfair), serif', fontWeight: 700, lineHeight: 1.28, margin: '14px 0 0' };

export default function About() {
  return (
    <section id="despre" style={{ background: 'var(--bg)', padding: 'clamp(64px, 9vh, 104px) 32px', position: 'relative' }}>
      <hr className="rule" style={{ maxWidth: 1240, margin: '0 auto 54px' }} />
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 40, alignItems: 'end', marginBottom: 56 }} className="about-head">
          <div>
            <Reveal><span className="eyebrow" style={{ marginBottom: 24, display: 'inline-flex' }}>01 — Despre Arry Production</span></Reveal>
            <RevealLines
              style={{ fontSize: 'clamp(23px, 5.4vw, 52px)', lineHeight: 1.16, letterSpacing: '-0.02em', textTransform: 'uppercase', fontWeight: 800, color: 'var(--tx)', marginTop: 18 }}
              lines={[
                'Știm tot despre',
                'educația muzicală',
                'a copiilor,',
                <span key="s" style={{ color: 'var(--sand)' }}>unde fiecare detaliu</span>,
                'este gândit',
              ]}
            />
          </div>
          <Reveal delay={0.15}>
            <p style={{ fontSize: 15, color: 'var(--tx-mut)', lineHeight: 1.8, margin: 0, maxWidth: 380 }}>
              Creăm condiții speciale de calitate a învățării și un mediu de
              dezvoltare unic. Copiii, adolescenții și adulții descoperă bucuria
              de a cânta, de a crea și de a se exprima liber prin artă.
            </p>
          </Reveal>
        </div>

        <Stagger className="mosaic">
          <StaggerItem style={{ gridArea: 'a' }}>
            <SandCard style={{ minHeight: 300, height: '100%' }}>
              <span style={kicker}>Direcție</span>
              <p style={{ ...cardTitle, fontSize: 21 }}>Pregătire pentru admiterea în licee și colegii de muzică</p>
            </SandCard>
          </StaggerItem>

          <StaggerItem style={{ gridArea: 'b' }} className="ph-wrap">
            <Parallax distance={22} style={{ height: '100%', minHeight: 200 }}>
              <img src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80&auto=format&fit=crop" alt="Microfon de studio" className="ph" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Parallax>
          </StaggerItem>

          <StaggerItem style={{ gridArea: 'c' }}>
            <SandCard style={{ height: '100%' }}>
              <span style={kicker}>Scenă</span>
              <p style={{ ...cardTitle, fontSize: 17 }}>Participare la concursuri și proiecte artistice</p>
            </SandCard>
          </StaggerItem>

          <StaggerItem style={{ gridArea: 'd' }}>
            <SandCard style={{ height: '100%' }}>
              <span style={kicker}>Grijă</span>
              <p style={{ ...cardTitle, fontSize: 17 }}>Susținere psihologică și emoțională</p>
            </SandCard>
          </StaggerItem>

          <StaggerItem style={{ gridArea: 'e' }} className="ph-wrap">
            <Parallax distance={26} style={{ height: '100%', minHeight: 220 }}>
              <img src="https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&q=80&auto=format&fit=crop" alt="Scenă de concert" className="ph" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Parallax>
          </StaggerItem>

          <StaggerItem style={{ gridArea: 'f' }}>
            <SandCard style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap', height: '100%' }}>
              <p style={{ ...cardTitle, fontSize: 22, margin: 0, flex: '1 1 240px' }}>Abordare individuală pentru fiecare elev</p>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, opacity: 0.75, flex: '1 1 240px' }}>
                Profesorii noștri adaptează fiecare lecție la personalitatea și
                ritmul elevului. Nu există un tipar unic — există parcursul tău.
              </p>
            </SandCard>
          </StaggerItem>
        </Stagger>
      </div>

      <style>{`
        .mosaic {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: minmax(190px, auto);
          grid-template-areas: "a b c" "a d e" "f f f";
          gap: 14px;
        }
        @media (max-width: 860px) {
          .about-head { grid-template-columns: 1fr !important; }
          .mosaic { grid-template-columns: 1fr 1fr; grid-auto-rows: minmax(170px, auto); grid-template-areas: "a a" "b c" "d e" "f f"; }
        }
        @media (max-width: 520px) {
          .mosaic { grid-template-columns: 1fr; grid-auto-rows: auto; grid-template-areas: "a" "b" "c" "d" "e" "f"; }
        }
      `}</style>
    </section>
  );
}
