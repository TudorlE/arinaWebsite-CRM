'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { LogoLockup } from '@/components/Logo';
import { openBooking } from '@/components/Booking';
import { useTheme } from '@/components/ThemeProvider';
import { useLocale } from '@/lib/i18n';
import { LOCALES } from '@/lib/translations';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const links = t.nav.links;

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

  const navBg = theme === 'dark' ? 'rgba(16, 13, 11, 0.88)' : 'rgba(250, 247, 242, 0.88)';
  const mobileBg = theme === 'dark' ? 'rgba(16,13,11,0.98)' : 'rgba(250,247,242,0.98)';

  const LangSwitch = ({ style }: { style?: React.CSSProperties }) => (
    <div className="lang-switch" style={style}>
      {LOCALES.map(l => (
        <button key={l.code} onClick={() => setLocale(l.code)} className={`lang-pill${locale === l.code ? ' active' : ''}`}>
          {l.label}
        </button>
      ))}
    </div>
  );

  const ThemeToggle = ({ style }: { style?: React.CSSProperties }) => (
    <motion.button
      whileHover={{ scale: 1.08, rotate: 12 }} whileTap={{ scale: 0.9 }}
      onClick={toggleTheme} className="theme-toggle" style={style}
      aria-label={theme === 'dark' ? t.theme.toLight : t.theme.toDark}
    >
      {theme === 'dark' ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
    </motion.button>
  );

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: scrolled ? navBg : 'transparent',
          backdropFilter: scrolled ? 'blur(18px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'var(--line)' : 'transparent'}`,
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => go('#acasa')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--tx)' }}>
            <LogoLockup />
          </motion.button>

          <motion.div
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } } }}
            style={{ display: 'flex', alignItems: 'center', gap: 30 }} className="hide-mobile"
          >
            {links.map(l => (
              <motion.button key={l.href} onClick={() => go(l.href)} className="link-cta" style={{ fontSize: 11, letterSpacing: '0.13em', color: 'var(--tx-mut)' }}
                variants={{ hidden: { opacity: 0, y: -8 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ color: 'var(--tx)' }}
              >
                {l.label}
              </motion.button>
            ))}
          </motion.div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="hide-mobile">
            <LangSwitch />
            <ThemeToggle />
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={book} className="btn-outline solid" style={{ padding: '12px 22px', fontSize: 10.5 }}>
              {t.nav.bookBtn}
            </motion.button>
          </div>

          <div style={{ display: 'none', alignItems: 'center', gap: 10 }} className="show-mobile">
            <ThemeToggle />
            <button onClick={() => setOpen(v => !v)} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx)' }}>
              {open ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
            </button>
          </div>
        </div>
        <motion.div style={{ scaleX: progress, transformOrigin: '0%', height: 2, background: 'var(--accent)', opacity: scrolled ? 1 : 0, transition: 'opacity 0.3s' }} />
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
            style={{ position: 'fixed', top: 70, left: 0, right: 0, zIndex: 40, background: mobileBg, backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--line)' }}>
            <motion.div
              initial="hidden" animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
              style={{ maxWidth: 1240, margin: '0 auto', padding: '18px 24px 26px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {links.map(l => (
                <motion.button key={l.href} onClick={() => go(l.href)}
                  variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.97 }}
                  style={{ textAlign: 'left', padding: '14px 4px', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--tx)', background: 'none', border: 'none', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
                  {l.label}
                </motion.button>
              ))}
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <LangSwitch style={{ alignSelf: 'center' }} />
                <button onClick={book} className="btn-outline solid" style={{ justifyContent: 'center' }}>{t.nav.bookBtn}</button>
              </motion.div>
            </motion.div>
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
