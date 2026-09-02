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
      background: '#151517',
      border: '1px solid rgba(255,90,31,0.4)',
      height: 40, minWidth: 56, flexShrink: 0,
    }}>
      {BARS.map((h, i) => (
        <div key={i} className="bar-pulse" style={{
          width: 3,
          background: '#ff5a1f',
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
  const crmUrl = process.env.NEXT_PUBLIC_CRM_URL ?? '/admin';

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
          background: scrolled ? 'rgba(10, 10, 11, 0.94)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <button onClick={() => go('#acasa')} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <SoundBarsLogo />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.01em', lineHeight: 1.15, margin: 0, color: '#fff', fontFamily: 'var(--font-inter), sans-serif' }}>
                ARRY <span style={{ color: 'var(--orange)' }}>PRODUCTION</span>
              </p>
              <p style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', margin: '3px 0 0', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-inter), sans-serif' }}>
                Music School
              </p>
            </div>
          </button>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 30 }} className="hide-mobile">
            {links.map(l => (
              <button key={l.href} onClick={() => go(l.href)} className="link-cta"
                style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.68)' }}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Right buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }} className="hide-mobile">
            {crmUrl && (
              <a href={crmUrl} target="_blank" rel="noopener noreferrer" className="link-cta" style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
                CRM <ExternalLink style={{ width: 12, height: 12 }} />
              </a>
            )}
            <button onClick={() => go('#inscriere')} className="btn-outline solid" style={{ padding: '11px 24px', fontSize: 11.5 }}>
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
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
            style={{ position: 'fixed', top: 68, left: 0, right: 0, zIndex: 40, background: 'rgba(10,10,11,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--line)' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {links.map(l => (
                <button key={l.href} onClick={() => go(l.href)}
                  style={{ textAlign: 'left', padding: '14px 4px', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
                  {l.label}
                </button>
              ))}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {crmUrl && <a href={crmUrl} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ justifyContent: 'center' }}>CRM <ExternalLink style={{ width: 14, height: 14 }} /></a>}
                <button onClick={() => go('#inscriere')} className="btn-outline solid" style={{ justifyContent: 'center' }}>Înscrie-te acum</button>
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
