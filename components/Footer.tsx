'use client';
import { ExternalLink } from 'lucide-react';
import { LogoLockup } from '@/components/Logo';
import { openBooking } from '@/components/Booking';

const navLinks = [
  { label: 'Acasă', href: '#acasa' }, { label: 'Despre', href: '#despre' },
  { label: 'Cursuri', href: '#cursuri' }, { label: 'Galerie', href: '#galerie' },
  { label: 'Arina Bădulescu', href: '#fondator' }, { label: 'Contact', href: '#contact' },
];
const courses = ['Pian', 'Tobe', 'Canto', 'Chitară', 'Solfegiu'];

const go = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

export default function Footer() {
  const crmUrl = process.env.NEXT_PUBLIC_CRM_URL || '/admin';

  return (
    <footer style={{ background: 'var(--bg)', color: 'var(--tx)', padding: '84px 32px 0', borderTop: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr 1fr 1.1fr', gap: 48, paddingBottom: 52 }} className="footer-grid">

          <div>
            <button onClick={() => go('#acasa')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 22, color: 'var(--tx)' }}>
              <LogoLockup compact />
            </button>

            <p style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--tx-mut)', margin: '0 0 26px', maxWidth: 300 }}>
              Școala unde pasiunea pentru muzică devine performanță. Cursuri de
              pian, tobe, canto, chitară și solfegiu, în inima Chișinăului.
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Facebook', 'Instagram', 'YouTube'].map(s => (
                <a key={s} href="#" style={{ padding: '9px 14px', border: '1px solid var(--line-strong)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--tx-mut)' }}>
                  {s}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tx-faint)', margin: '0 0 18px' }}>Navigare</h4>
            {navLinks.map(l => (
              <button key={l.href} onClick={() => go(l.href)} style={{ display: 'block', fontSize: 12.5, color: 'var(--tx-mut)', padding: '7px 0', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>{l.label}</button>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tx-faint)', margin: '0 0 18px' }}>Cursuri</h4>
            {courses.map(c => (
              <button key={c} onClick={() => go('#cursuri')} style={{ display: 'block', fontSize: 12.5, color: 'var(--tx-mut)', padding: '7px 0', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>{c}</button>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tx-faint)', margin: '0 0 18px' }}>Acces rapid</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={openBooking} className="btn-outline solid" style={{ fontSize: 10.5, padding: '12px 16px' }}>Programează o lecție</button>
              <a href={crmUrl} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ fontSize: 10.5, padding: '12px 16px' }}>
                Accesează CRM <ExternalLink style={{ width: 12, height: 12, marginLeft: 'auto' }} />
              </a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--line)', padding: '24px 0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            <p style={{ fontSize: 11.5, color: 'var(--tx-faint)', margin: 0 }}>© {new Date().getFullYear()} Arry Studio. Toate drepturile rezervate.</p>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--tx-faint)', margin: 0, fontStyle: 'italic' }}>Muzica este limbajul universal al sufletului.</p>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }`}</style>
    </footer>
  );
}
