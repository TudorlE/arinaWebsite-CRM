'use client';
import { ExternalLink } from 'lucide-react';
import { BLACK, OFFWHITE, LIME, HAIRLINE_ON_BLACK, display, body } from './theme';

const navLinks = [
  { label: 'Acasă', href: '#acasa' }, { label: 'Despre', href: '#despre' },
  { label: 'Cursuri', href: '#cursuri' }, { label: 'Galerie', href: '#galerie' },
  { label: 'Arina Bădulescu', href: '#fondator' }, { label: 'Contact', href: '#contact' },
];
const courses = ['Pian', 'Tobe', 'Canto', 'Solfegiu', 'Chitară'];

const go = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

export default function Footer() {
  const crmUrl = '/admin';

  return (
    <footer style={{ background: BLACK, color: OFFWHITE, padding: '80px 24px 0', borderTop: `1px solid ${HAIRLINE_ON_BLACK}` }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr', gap: 52, paddingBottom: 60 }} className="footer-grid">

          {/* Brand */}
          <div>
            <button onClick={() => go('#acasa')} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 22 }}>
              <div style={{ width: 32, height: 32, background: LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: display, fontSize: 16, color: BLACK, lineHeight: 1 }}>A</span>
              </div>
              <p style={{ fontFamily: display, fontSize: 15, letterSpacing: '0.02em', lineHeight: 1, margin: 0, color: OFFWHITE }}>
                ARRY <span style={{ color: LIME }}>PRODUCTION</span>
              </p>
            </button>

            <p style={{ fontFamily: body, fontSize: 14, lineHeight: 1.7, color: 'rgba(244,243,237,0.4)', margin: '0 0 28px', maxWidth: 280 }}>
              Școala unde pasiunea pentru muzică devine performanță. Cursuri de pian, tobe, canto, chitară și solfegiu.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              {['Web', 'FB', 'YT'].map((s, i) => (
                <button key={i} title={s}
                  style={{ width: 36, height: 36, background: 'transparent', border: `1px solid ${HAIRLINE_ON_BLACK}`, color: OFFWHITE, cursor: 'pointer', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', fontFamily: body }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = LIME; el.style.color = LIME; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = HAIRLINE_ON_BLACK; el.style.color = OFFWHITE; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <h4 style={{ fontFamily: body, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: LIME, margin: '0 0 22px' }}>Navigare</h4>
            {navLinks.map(l => (
              <button key={l.href} onClick={() => go(l.href)}
                style={{ display: 'block', fontFamily: body, fontSize: 14, fontWeight: 500, color: 'rgba(244,243,237,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', transition: 'color 0.2s', textAlign: 'left' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = LIME; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(244,243,237,0.5)'; }}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Courses */}
          <div>
            <h4 style={{ fontFamily: body, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: LIME, margin: '0 0 22px' }}>Cursuri</h4>
            {courses.map(c => (
              <button key={c} onClick={() => go('#cursuri')}
                style={{ display: 'block', fontFamily: body, fontSize: 14, fontWeight: 500, color: 'rgba(244,243,237,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', transition: 'color 0.2s', textAlign: 'left' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = LIME; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(244,243,237,0.5)'; }}>
                {c}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div>
            <h4 style={{ fontFamily: body, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: LIME, margin: '0 0 22px' }}>Acces rapid</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {crmUrl ? (
                <a href={crmUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', fontFamily: body, fontSize: 13, fontWeight: 700, color: OFFWHITE, border: `1px solid ${HAIRLINE_ON_BLACK}`, textDecoration: 'none', transition: 'all 0.2s', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = LIME; (e.currentTarget as HTMLElement).style.color = LIME; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = HAIRLINE_ON_BLACK; (e.currentTarget as HTMLElement).style.color = OFFWHITE; }}>
                  Accesează CRM <ExternalLink style={{ width: 13, height: 13, marginLeft: 'auto' }} />
                </a>
              ) : (
                <span style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, background: 'rgba(244,243,237,0.04)', color: 'rgba(244,243,237,0.2)', cursor: 'not-allowed' }}>CRM indisponibil</span>
              )}
              <button onClick={() => go('#inscriere')}
                style={{ padding: '13px 16px', fontFamily: body, fontSize: 13, fontWeight: 700, background: LIME, color: BLACK, border: 'none', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = OFFWHITE; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = LIME; }}>
                Înscrie-te acum →
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${HAIRLINE_ON_BLACK}`, padding: '26px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: body, fontSize: 13, color: 'rgba(244,243,237,0.3)', margin: 0 }}>© {new Date().getFullYear()} Arry Production. Toate drepturile rezervate.</p>
          <p style={{ fontFamily: body, fontSize: 13, color: 'rgba(244,243,237,0.3)', margin: 0 }}>Muzica este limbajul universal al sufletului.</p>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }`}</style>
    </footer>
  );
}
