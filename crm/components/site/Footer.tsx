'use client';
import { ExternalLink } from 'lucide-react';

const navLinks = [
  { label: 'Acasă', href: '#acasa' }, { label: 'Despre', href: '#despre' },
  { label: 'Cursuri', href: '#cursuri' }, { label: 'Galerie', href: '#galerie' },
  { label: 'Arina Bădulescu', href: '#fondator' }, { label: 'Contact', href: '#contact' },
];
const courses = ['Pian 🎹', 'Tobe 🥁', 'Canto 🎤', 'Solfegiu 🎼', 'Chitară 🎸'];

const BARS = [38, 76, 50, 100, 66, 86, 42, 70, 55, 80];

const go = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

export default function Footer() {
  const crmUrl = '/admin';

  return (
    <footer style={{ background: 'linear-gradient(180deg, #0D0905 0%, #090604 100%)', color: '#fff', padding: '80px 24px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr', gap: 52, paddingBottom: 60 }} className="footer-grid">

          {/* Brand */}
          <div>
            {/* Logo */}
            <button onClick={() => go('#acasa')} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, padding: '6px 10px 5px', background: 'linear-gradient(145deg, #150F09, #2A1C0E)', borderRadius: 12, border: '1.5px solid rgba(244,168,92,0.45)', boxShadow: '0 0 20px rgba(244,168,92,0.15)', height: 40, minWidth: 54 }}>
                {BARS.map((h, i) => (
                  <div key={i} className="bar-pulse" style={{ width: 3, borderRadius: 2, background: 'linear-gradient(to top, #9C4A1E, #F4A85C, #F7C98A)', height: `${h}%`, animationDelay: `${i * 0.09}s`, animationDuration: `${0.65 + (i % 4) * 0.14}s` }} />
                ))}
              </div>
              <div>
                <p style={{ fontWeight: 900, fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1.15, margin: 0, color: '#fff', fontFamily: 'var(--font-inter), sans-serif' }}>
                  ARRY <span style={{ color: '#F4A85C' }}>PRODUCTION</span>
                </p>
                <p style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(244,168,92,0.65)', margin: '3px 0 0', fontFamily: 'var(--font-inter), sans-serif' }}>
                  Music School
                </p>
              </div>
            </button>

            <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.38)', margin: '0 0 28px', maxWidth: 280 }}>
              Școala unde pasiunea pentru muzică devine performanță. Cursuri de pian, tobe, canto, chitară și solfegiu.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              {[{ icon: '🌐', label: 'web' }, { icon: '📘', label: 'facebook' }, { icon: '▶️', label: 'youtube' }].map((s, i) => (
                <button key={i} title={s.label}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(244,168,92,0.07)', border: '1px solid rgba(244,168,92,0.18)', color: '#F4A85C', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.22s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(244,168,92,0.18)'; el.style.transform = 'scale(1.12) translateY(-2px)'; el.style.boxShadow = '0 6px 20px rgba(244,168,92,0.2)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(244,168,92,0.07)'; el.style.transform = 'scale(1)'; el.style.boxShadow = 'none'; }}>
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#F4A85C', margin: '0 0 22px', opacity: 0.85 }}>Navigare</h4>
            {navLinks.map(l => (
              <button key={l.href} onClick={() => go(l.href)}
                style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.38)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', transition: 'color 0.2s', textAlign: 'left' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = '#F4A85C'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.38)'; }}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Courses */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#F4A85C', margin: '0 0 22px', opacity: 0.85 }}>Cursuri</h4>
            {courses.map(c => (
              <button key={c} onClick={() => go('#cursuri')}
                style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.38)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', transition: 'color 0.2s', textAlign: 'left' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = '#F4A85C'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.38)'; }}>
                {c}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#F4A85C', margin: '0 0 22px', opacity: 0.85 }}>Acces rapid</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {crmUrl ? (
                <a href={crmUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 14, fontSize: 14, fontWeight: 700, background: 'rgba(244,168,92,0.07)', color: '#F4A85C', border: '1px solid rgba(244,168,92,0.18)', textDecoration: 'none', transition: 'all 0.22s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(244,168,92,0.15)'; el.style.boxShadow = '0 4px 20px rgba(244,168,92,0.15)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(244,168,92,0.07)'; el.style.boxShadow = 'none'; }}>
                  🎛️ Accesează CRM <ExternalLink style={{ width: 13, height: 13, marginLeft: 'auto' }} />
                </a>
              ) : (
                <span style={{ padding: '12px 16px', borderRadius: 14, fontSize: 14, fontWeight: 700, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }}>CRM indisponibil</span>
              )}
              <button onClick={() => go('#inscriere')}
                style={{ padding: '13px 16px', borderRadius: 14, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg, #E08A3C, #F4A85C)', color: '#0d0a00', border: 'none', cursor: 'pointer', transition: 'all 0.22s' }}
                onMouseEnter={e => { const el = e.target as HTMLElement; el.style.boxShadow = '0 6px 24px rgba(244,168,92,0.4)'; el.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { const el = e.target as HTMLElement; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)'; }}>
                Înscrie-te acum ✦
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '26px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.22)', margin: 0 }}>© {new Date().getFullYear()} Arry Production. Toate drepturile rezervate.</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.22)', margin: 0 }}>Muzica este limbajul universal al sufletului. ♪</p>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }`}</style>
    </footer>
  );
}
