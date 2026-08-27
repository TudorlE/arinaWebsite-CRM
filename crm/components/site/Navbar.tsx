'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ExternalLink } from 'lucide-react';
import { BLACK, OFFWHITE, LIME, HAIRLINE_ON_BLACK, display, body } from './theme';

const links = [
  { href: '#acasa', label: 'Acasă' },
  { href: '#despre', label: 'Despre' },
  { href: '#cursuri', label: 'Cursuri' },
  { href: '#galerie', label: 'Galerie' },
  { href: '#fondator', label: 'Arina Bădulescu' },
  { href: '#contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const crmUrl = '/admin';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: scrolled ? BLACK : 'rgba(2,7,7,0.0)',
          backdropFilter: scrolled ? 'none' : 'none',
          borderBottom: `1px solid ${scrolled ? HAIRLINE_ON_BLACK : 'transparent'}`,
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <button onClick={() => go('#acasa')} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ width: 34, height: 34, background: LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: display, fontSize: 18, color: BLACK, lineHeight: 1 }}>A</span>
            </div>
            <p style={{ fontFamily: display, fontSize: 17, letterSpacing: '0.02em', lineHeight: 1, margin: 0, color: OFFWHITE }}>
              ARRY <span style={{ color: LIME }}>PRODUCTION</span>
            </p>
          </button>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hide-mobile">
            {links.map(l => (
              <button key={l.href} onClick={() => go(l.href)}
                style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(244,243,237,0.65)', transition: 'color 0.18s', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: body,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = LIME; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(244,243,237,0.65)'; }}
              >{l.label}</button>
            ))}
          </div>

          {/* Right buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="hide-mobile">
            {crmUrl && (
              <a href={crmUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 11, fontWeight: 700,
                  background: 'transparent', color: OFFWHITE, border: `1px solid ${HAIRLINE_ON_BLACK}`, transition: 'all 0.18s',
                  fontFamily: body, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = LIME; (e.currentTarget as HTMLElement).style.color = LIME; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = HAIRLINE_ON_BLACK; (e.currentTarget as HTMLElement).style.color = OFFWHITE; }}>
                CRM <ExternalLink style={{ width: 11, height: 11 }} />
              </a>
            )}
            <button onClick={() => go('#inscriere')}
              style={{
                padding: '11px 22px', fontSize: 12, fontWeight: 700, background: LIME, color: BLACK,
                transition: 'all 0.18s', fontFamily: body, letterSpacing: '0.06em', textTransform: 'uppercase', border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = OFFWHITE; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = LIME; }}>
              Înscrie-te
            </button>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(v => !v)}
            style={{ display: 'none', padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: OFFWHITE }}
            className="show-mobile">
            {open ? <X style={{ width: 26, height: 26 }} /> : <Menu style={{ width: 26, height: 26 }} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 45, background: BLACK, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {links.map((l, i) => (
                <motion.button key={l.href} onClick={() => go(l.href)}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  style={{
                    textAlign: 'left', padding: '14px 4px', fontSize: 'clamp(32px, 9vw, 48px)', lineHeight: 1.05,
                    color: OFFWHITE, background: 'none', border: 'none', cursor: 'pointer', fontFamily: display, letterSpacing: '0.01em',
                    borderBottom: `1px solid ${HAIRLINE_ON_BLACK}`, textTransform: 'uppercase',
                  }}>
                  {l.label}
                </motion.button>
              ))}
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {crmUrl && <a href={crmUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px', fontWeight: 700, color: OFFWHITE, border: `1px solid ${HAIRLINE_ON_BLACK}`, fontFamily: body, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 13 }}>CRM <ExternalLink style={{ width: 15, height: 15 }} /></a>}
                <button onClick={() => go('#inscriere')} style={{ padding: '16px', fontWeight: 700, background: LIME, color: BLACK, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: body, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Înscrie-te acum</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) { .hide-mobile { display: none !important; } .show-mobile { display: flex !important; } }
        @media (min-width: 901px) { .show-mobile { display: none !important; } }
      `}</style>
    </>
  );
}
