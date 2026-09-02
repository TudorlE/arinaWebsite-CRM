'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Menu, X, ExternalLink } from 'lucide-react';
import { LogoLockup } from '@/components/Logo';
import { openBooking } from '@/components/Booking';

const links = [
  { href: '#acasa', label: 'Acasă' },
  { href: '#despre', label: 'Despre' },
  { href: '#cursuri', label: 'Cursuri' },
  { href: '#galerie', label: 'Galerie' },
  { href: '#fondator', label: 'Arina Bădulescu' },
  { href: '#contact', label: 'Contact' },
];

const PHONE = '+373 60 081 991';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const crmUrl = process.env.NEXT_PUBLIC_CRM_URL || '/admin';
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };
  const book = () => { setOpen(false); openBooking(); };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: scrolled ? 'rgba(16, 13, 11, 0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(18px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'var(--line)' : 'transparent'}`,
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

          <button onClick={() => go('#acasa')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--tx)' }}>
            <LogoLockup />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 30 }} className="hide-mobile">
            {links.map(l => (
              <button key={l.href} onClick={() => go(l.href)} className="link-cta" style={{ fontSize: 11, letterSpacing: '0.13em', color: 'var(--tx-mut)' }}>
                {l.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }} className="hide-mobile">
            <a href={`tel:${PHONE.replace(/\s/g, '')}`} className="link-cta" style={{ fontSize: 11, color: 'var(--tx-mut)', letterSpacing: '0.06em' }}>{PHONE}</a>
            <a href={crmUrl} target="_blank" rel="noopener noreferrer" className="link-cta" style={{ fontSize: 11, color: 'var(--tx-faint)' }}>
              CRM <ExternalLink style={{ width: 12, height: 12 }} />
            </a>
            <button onClick={book} className="btn-outline solid" style={{ padding: '12px 22px', fontSize: 10.5 }}>
              Programează o lecție
            </button>
          </div>

          <button onClick={() => setOpen(v => !v)} style={{ display: 'none', padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx)' }} className="show-mobile">
            {open ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>
        </div>
        <motion.div style={{ scaleX: progress, transformOrigin: '0%', height: 2, background: 'var(--accent)', opacity: scrolled ? 1 : 0, transition: 'opacity 0.3s' }} />
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
            style={{ position: 'fixed', top: 70, left: 0, right: 0, zIndex: 40, background: 'rgba(16,13,11,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--line)' }}>
            <div style={{ maxWidth: 1240, margin: '0 auto', padding: '18px 24px 26px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {links.map(l => (
                <button key={l.href} onClick={() => go(l.href)}
                  style={{ textAlign: 'left', padding: '14px 4px', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--tx)', background: 'none', border: 'none', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
                  {l.label}
                </button>
              ))}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href={`tel:${PHONE.replace(/\s/g, '')}`} className="btn-outline" style={{ justifyContent: 'center' }}>{PHONE}</a>
                <a href={crmUrl} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ justifyContent: 'center' }}>CRM <ExternalLink style={{ width: 14, height: 14 }} /></a>
                <button onClick={book} className="btn-outline solid" style={{ justifyContent: 'center' }}>Programează o lecție</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 980px) { .hide-mobile { display: none !important; } .show-mobile { display: flex !important; } }
        @media (min-width: 981px) { .show-mobile { display: none !important; } }
      `}</style>
    </>
  );
}
