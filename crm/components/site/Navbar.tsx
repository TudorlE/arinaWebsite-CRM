'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ExternalLink } from 'lucide-react';

const links = [
  { href: '#acasa', label: 'Acasă' },
  { href: '#despre', label: 'Despre' },
  { href: '#cursuri', label: 'Cursuri' },
  { href: '#galerie', label: 'Galerie' },
  { href: '#fondator', label: 'Arina Bădulescu' },
  { href: '#contact', label: 'Contact' },
];

const BARS = [38, 76, 50, 100, 66, 86, 42, 70, 55, 80];

function SoundBarsLogo() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 2.5,
      padding: '6px 11px 5px',
      background: 'linear-gradient(145deg, #0d0820, #1e1240)',
      borderRadius: 13,
      border: '1.5px solid rgba(255,213,74,0.55)',
      boxShadow: '0 0 22px rgba(255,213,74,0.22), 0 0 50px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.07)',
      height: 44, minWidth: 60, flexShrink: 0,
    }}>
      {BARS.map((h, i) => (
        <div key={i} className="bar-pulse" style={{
          width: 3, borderRadius: 2,
          background: `linear-gradient(to top, #B8820A, #FFD54A, #FFE890)`,
          height: `${h}%`,
          animationDelay: `${i * 0.09}s`,
          animationDuration: `${0.65 + (i % 4) * 0.14}s`,
        }} />
      ))}
    </div>
  );
}

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
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: scrolled ? 'rgba(5, 2, 16, 0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(28px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(28px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,213,74,0.1)' : 'none',
          boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.6), 0 0 80px rgba(109,40,217,0.05)' : 'none',
          transition: 'all 0.35s ease',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '13px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <button onClick={() => go('#acasa')} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <SoundBarsLogo />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em', lineHeight: 1.15, margin: 0, color: '#ffffff', fontFamily: 'var(--font-inter), sans-serif' }}>
                ARRY <span style={{ color: '#FFD54A' }}>PRODUCTION</span>
              </p>
              <p style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', margin: '3px 0 0', color: 'rgba(255,213,74,0.7)', fontFamily: 'var(--font-inter), sans-serif' }}>
                Music School
              </p>
            </div>
          </button>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="hide-mobile">
            {links.map(l => (
              <button key={l.href} onClick={() => go(l.href)}
                style={{ padding: '8px 14px', borderRadius: 99, fontSize: 13.5, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s', letterSpacing: '0.01em', fontFamily: 'var(--font-inter), sans-serif' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,213,74,0.1)'; el.style.color = '#FFD54A'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'none'; el.style.color = 'rgba(255,255,255,0.7)'; }}
              >{l.label}</button>
            ))}
          </div>

          {/* Right buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="hide-mobile">
            {crmUrl && (
              <a href={crmUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, fontSize: 12.5, fontWeight: 700, background: 'rgba(255,213,74,0.08)', color: 'rgba(255,213,74,0.85)', border: '1px solid rgba(255,213,74,0.22)', transition: 'all 0.2s', fontFamily: 'var(--font-inter), sans-serif' }}>
                CRM <ExternalLink style={{ width: 12, height: 12 }} />
              </a>
            )}
            <button onClick={() => go('#inscriere')}
              style={{ padding: '10px 24px', borderRadius: 99, fontSize: 13.5, fontWeight: 700, background: 'linear-gradient(135deg, #C9A020, #FFD54A, #F5C440)', color: '#0d0a00', boxShadow: '0 4px 20px rgba(255,213,74,0.45), 0 0 0 1px rgba(255,213,74,0.25)', transition: 'all 0.22s', fontFamily: 'var(--font-inter), sans-serif' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'scale(1.05) translateY(-1px)'; el.style.boxShadow = '0 8px 30px rgba(255,213,74,0.6)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'scale(1)'; el.style.boxShadow = '0 4px 20px rgba(255,213,74,0.45), 0 0 0 1px rgba(255,213,74,0.25)'; }}>
              Înscrie-te
            </button>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(v => !v)}
            style={{ display: 'none', padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
            className="show-mobile">
            {open ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ position: 'fixed', top: 70, left: 0, right: 0, zIndex: 40, background: 'rgba(5,2,16,0.98)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,213,74,0.1)', boxShadow: '0 12px 50px rgba(0,0,0,0.7)' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {links.map(l => (
                <button key={l.href} onClick={() => go(l.href)}
                  style={{ textAlign: 'left', padding: '12px 16px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {l.label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {crmUrl && <a href={crmUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, fontWeight: 700, background: 'rgba(255,213,74,0.08)', color: '#FFD54A', border: '1px solid rgba(255,213,74,0.2)' }}>CRM <ExternalLink style={{ width: 15, height: 15 }} /></a>}
                <button onClick={() => go('#inscriere')} style={{ padding: '14px', borderRadius: 12, fontWeight: 700, background: 'linear-gradient(135deg,#C9A020,#FFD54A)', color: '#0d0a00', fontSize: 15 }}>Înscrie-te acum</button>
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
