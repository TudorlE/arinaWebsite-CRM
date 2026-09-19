'use client';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { LogoLockup } from '@/components/Logo';
import { openBooking } from '@/components/Booking';
import { Reveal, Stagger, StaggerItem, EASE } from '@/components/motionx';
import { useLocale } from '@/lib/i18n';

const go = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

export default function Footer() {
  const crmUrl = process.env.NEXT_PUBLIC_CRM_URL || '/admin';
  const { t } = useLocale();
  const navLinks = t.nav.links;
  const courses = t.common.courses;

  return (
    <footer style={{ background: 'var(--bg)', color: 'var(--tx)', padding: '84px 32px 0', borderTop: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <Stagger style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr 1fr 1.1fr', gap: 48, paddingBottom: 52 }} className="footer-grid">

          <StaggerItem>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => go('#acasa')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 22, color: 'var(--tx)' }}>
              <LogoLockup compact />
            </motion.button>

            <p style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--tx-mut)', margin: '0 0 26px', maxWidth: 300 }}>
              {t.footer.desc}
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {t.footer.socials.map(s => (
                <motion.a key={s} href="#" whileHover={{ y: -3, borderColor: 'var(--sand-deep)', color: 'var(--tx)' }} transition={{ duration: 0.25, ease: EASE }}
                  style={{ padding: '9px 14px', border: '1px solid var(--line-strong)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--tx-mut)', display: 'inline-block' }}>
                  {s}
                </motion.a>
              ))}
            </div>
          </StaggerItem>

          <StaggerItem>
            <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tx-faint)', margin: '0 0 18px' }}>{t.footer.navTitle}</h4>
            {navLinks.map(l => (
              <motion.button key={l.href} onClick={() => go(l.href)} whileHover={{ x: 6, color: 'var(--tx)' }} transition={{ duration: 0.2, ease: EASE }}
                style={{ display: 'block', fontSize: 12.5, color: 'var(--tx-mut)', padding: '7px 0', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>{l.label}</motion.button>
            ))}
          </StaggerItem>

          <StaggerItem>
            <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tx-faint)', margin: '0 0 18px' }}>{t.footer.coursesTitle}</h4>
            {courses.map(c => (
              <motion.button key={c} onClick={() => go('#cursuri')} whileHover={{ x: 6, color: 'var(--tx)' }} transition={{ duration: 0.2, ease: EASE }}
                style={{ display: 'block', fontSize: 12.5, color: 'var(--tx-mut)', padding: '7px 0', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>{c}</motion.button>
            ))}
          </StaggerItem>

          <StaggerItem>
            <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tx-faint)', margin: '0 0 18px' }}>{t.footer.quickTitle}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={openBooking} className="btn-outline solid" style={{ fontSize: 10.5, padding: '12px 16px' }}>{t.footer.bookBtn}</button>
              <a href={crmUrl} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ fontSize: 10.5, padding: '12px 16px' }}>
                {t.footer.crmBtn} <ExternalLink style={{ width: 12, height: 12, marginLeft: 'auto' }} />
              </a>
            </div>
          </StaggerItem>
        </Stagger>

        <Reveal>
          <div style={{ borderTop: '1px solid var(--line)', padding: '24px 0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
              <p style={{ fontSize: 11.5, color: 'var(--tx-faint)', margin: 0 }}>© {new Date().getFullYear()} Arry Studio. {t.footer.rights}</p>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--tx-faint)', margin: 0, fontStyle: 'italic' }}>{t.footer.tagline}</p>
          </div>
        </Reveal>
      </div>
      <style>{`@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }`}</style>
    </footer>
  );
}
