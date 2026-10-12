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
 *
 * Three-column grid (1fr / auto / 1fr) so the nav is genuinely centered —
 * not just "whatever space is left" — with the avatar pinned far left and
 * logout pinned far right, symmetric regardless of either side's width.
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
        background: '#5934DC',
        boxShadow: '0 2px 12px rgba(44,23,112,0.22)',
      }}
    >
      <div
        style={{
          maxWidth: 1040, margin: '0 auto', padding: '12px 20px',
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12,
        }}
      >
        {/* Left — avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifySelf: 'start', minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.16)', border: '1.5px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff',
          }}>
            {initial}
          </div>
          <p className="student-nav-name" style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13.5, fontWeight: 700, margin: 0, display: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </p>
        </div>

        {/* Center — the two sections, in a soft rounded track */}
        <nav
          style={{
            display: 'flex', gap: 4, justifySelf: 'center',
            background: 'rgba(0,0,0,0.12)', padding: 4, borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {NAV.map(({ href, label, shortLabel, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
                  padding: '9px 16px', borderRadius: 999,
                  fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  color: active ? '#4C1D95' : 'rgba(255,255,255,0.78)',
                  background: active ? '#fff' : 'transparent',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                  transition: 'background-color 0.18s ease, color 0.18s ease',
                }}
              >
                <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span className="student-nav-short">{shortLabel}</span>
                <span className="student-nav-full">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right — logout */}
        <div style={{ justifySelf: 'end' }}>
          <button
            onClick={handleLogout}
            aria-label="Deconectare"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.92)', transition: 'background-color 0.18s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; }}
          >
            <LogOut style={{ width: 16, height: 16 }} />
          </button>
        </div>
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
