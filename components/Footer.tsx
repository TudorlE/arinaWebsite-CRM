'use client';
import { ExternalLink } from 'lucide-react';

const navLinks = [
  { label: 'Acasă', href: '#acasa' }, { label: 'Despre', href: '#despre' },
  { label: 'Cursuri', href: '#cursuri' }, { label: 'Galerie', href: '#galerie' },
  { label: 'Arina Bădulescu', href: '#fondator' }, { label: 'Contact', href: '#contact' },
];
const courses = ['Pian', 'Tobe', 'Canto', 'Solfegiu', 'Chitară'];

const BARS = [38, 76, 50, 100, 66, 86, 42, 70, 55, 80];

const go = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

export default function Footer() {
  const crmUrl = process.env.NEXT_PUBLIC_CRM_URL;

  return (
    <footer style={{ background: '#050506', color: '#fff', padding: '72px 24px 0', borderTop: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr', gap: 52, paddingBottom: 56 }} className="footer-grid">

          {/* Brand */}
          <div>
            <button onClick={() => go('#acasa')} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, padding: '6px 10px 5px', background: '#141416', border: '1px solid rgba(255,90,31,0.4)', height: 38, minWidth: 52 }}>
                {BARS.map((h, i) => (
                  <div key={i} className="bar-pulse" style={{ width: 3, background: 'var(--orange)', height: `${h}%`, animationDelay: `${i * 0.09}s`, animationDuration: `${0.65 + (i % 4) * 0.14}s` }} />
                ))}
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.01em', lineHeight: 1.15, margin: 0, color: '#fff', fontFamily: 'var(--font-inter), sans-serif' }}>
                  ARRY <span style={{ color: 'var(--orange)' }}>PRODUCTION</span>
                </p>
                <p style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0', fontFamily: 'var(--font-inter), sans-serif' }}>
                  Music School
                </p>
              </div>
            </button>

            <p style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.35)', margin: '0 0 28px', maxWidth: 280 }}>
              Școala unde pasiunea pentru muzică devine performanță. Cursuri de pian, tobe, canto, chitară și solfegiu.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              {[{ icon: '🌐', label: 'web' }, { icon: '📘', label: 'facebook' }, { icon: '▶️', label: 'youtube' }].map((s, i) => (
                <button key={i} title={s.label}
                  style={{ width: 36, height: 36, border: '1px solid rgba(255,90,31,0.3)', background: 'transparent', color: 'var(--orange)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.22s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--orange)'; el.style.color = '#050506'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--orange)'; }}>
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <h4 style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Navigare</h4>
            {navLinks.map(l => (
              <button key={l.href} onClick={() => go(l.href)} className="link-cta"
                style={{ display: 'block', fontSize: 11.5, color: 'rgba(255,255,255,0.5)', padding: '7px 0', textAlign: 'left' }}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Courses */}
          <div>
            <h4 style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Cursuri</h4>
            {courses.map(c => (
              <button key={c} onClick={() => go('#cursuri')} className="link-cta"
                style={{ display: 'block', fontSize: 11.5, color: 'rgba(255,255,255,0.5)', padding: '7px 0', textAlign: 'left' }}>
                {c}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div>
            <h4 style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Acces rapid</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {crmUrl ? (
                <a href={crmUrl} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ fontSize: 11, padding: '11px 16px' }}>
                  Accesează CRM <ExternalLink style={{ width: 12, height: 12, marginLeft: 'auto' }} />
                </a>
              ) : (
                <span style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid var(--line)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }}>CRM indisponibil</span>
              )}
              <button onClick={() => go('#inscriere')} className="btn-outline solid" style={{ fontSize: 11, padding: '12px 16px' }}>
                Înscrie-te acum
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--line)', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>© {new Date().getFullYear()} Arry Production. Toate drepturile rezervate.</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Muzica este limbajul universal al sufletului.</p>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }`}</style>
    </footer>
  );
}
