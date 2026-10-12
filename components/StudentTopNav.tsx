'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ClipboardList, CalendarRange, LogOut } from 'lucide-react';

type NavItem = { href: string; label: string; shortLabel: string; icon: typeof ClipboardList };

const NAV: NavItem[] = [
  { href: '/admin/attendance', label: 'Registru', shortLabel: 'Registru', icon: ClipboardList },
  { href: '/admin/general-schedule', label: 'Program General', shortLabel: 'Program', icon: CalendarRange },
];

/**
 * The student's entire CRM chrome — no sidebar, no "Arry Studio" branding,
 * just the two sections a student can ever reach, as a bold top bar. Built
 * separately from Sidebar rather than reusing/filtering it, since a student's
 * reachable surface is fixed and tiny (proxy.ts enforces exactly these two
 * routes) and deserves its own, simpler, more personal presentation.
 */
export default function StudentTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setName(d.user?.name ?? '')).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => pathname.startsWith(href);
  const initial = name ? name.charAt(0).toUpperCase() : 'E';

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'linear-gradient(110deg, #4726B8 0%, #5934DC 42%, #AC2A88 100%)',
        boxShadow: '0 4px 24px rgba(89,52,220,0.25)',
      }}
    >
      <div
        style={{
          maxWidth: 1040, margin: '0 auto', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginRight: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 12, flexShrink: 0,
            background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff',
          }}>
            {initial}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13.5, fontWeight: 700, margin: 0, display: 'none' }} className="student-nav-name">
            {name}
          </p>
        </div>

        <nav style={{ display: 'flex', gap: 6, flex: 1, overflowX: 'auto' }}>
          {NAV.map(({ href, label, shortLabel, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                  padding: '10px 14px', borderRadius: 999,
                  fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  color: active ? '#4726B8' : 'rgba(255,255,255,0.88)',
                  background: active ? '#fff' : 'rgba(255,255,255,0.14)',
                  border: active ? '1px solid #fff' : '1px solid rgba(255,255,255,0.22)',
                  boxShadow: active ? '0 6px 16px rgba(0,0,0,0.18)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span className="student-nav-short">{shortLabel}</span>
                <span className="student-nav-full">{label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          aria-label="Deconectare"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            width: 38, height: 38, borderRadius: 999, cursor: 'pointer',
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
            color: 'rgba(255,255,255,0.9)', transition: 'background-color 0.18s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.35)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; }}
        >
          <LogOut style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <style>{`
        @media (min-width: 640px) { .student-nav-name { display: block !important; } }
        .student-nav-full { display: none; }
        @media (min-width: 480px) {
          .student-nav-short { display: none; }
          .student-nav-full { display: inline; }
        }
      `}</style>
    </header>
  );
}
