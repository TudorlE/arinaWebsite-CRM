'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, CreditCard, Music2,
  Settings, LogOut, CalendarDays, ShieldCheck, UserCheck, DoorOpen, Globe, ExternalLink,
  CalendarRange, Repeat, Mic2, ClipboardList, BookOpen,
} from 'lucide-react';

type NavItem = {
  href: string; label: string; icon: typeof LogOut;
  adminOnly?: boolean; studentAllowed?: boolean; teacherAllowed?: boolean;
};

const nav: NavItem[] = [
  { href: '/admin',              label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/schedule',     label: 'Program',     icon: CalendarDays,   studentAllowed: true, teacherAllowed: true },
  { href: '/admin/general-schedule',   label: 'Program General',    icon: CalendarRange, teacherAllowed: true },
  { href: '/admin/recurring-schedule', label: 'Orar Fix',           icon: Repeat,        adminOnly: true },
  { href: '/admin/auditions',          label: 'Audiții',             icon: Mic2,          teacherAllowed: true },
  { href: '/admin/attendance',         label: 'Registru Frecvență', icon: ClipboardList, teacherAllowed: true },
  { href: '/admin/cabinets',     label: 'Cabinete General', icon: DoorOpen,                       teacherAllowed: true },
  { href: '/admin/payments',     label: 'Plăți',       icon: CreditCard },
  { href: '/admin/teachers',     label: 'Profesori General',   icon: Music2,                      teacherAllowed: true },
  { href: '/admin/teachers-attendance', label: 'Profesori Frecvență', icon: ClipboardList,         teacherAllowed: true },
  { href: '/admin/students',     label: 'Elevi General', icon: Users,                              teacherAllowed: true },
  { href: '/admin/students-attendance', label: 'Elevi Frecvență', icon: ClipboardList,             teacherAllowed: true },
  { href: '/admin/registrations',label: 'Cereri Site', icon: Globe,          adminOnly: true },
  { href: '/admin/approvals',    label: 'Aprobări',    icon: UserCheck,      adminOnly: true },
  { href: '/admin/roles',        label: 'Roluri',      icon: ShieldCheck,    adminOnly: true },
  { href: '/admin/settings',     label: 'Setări',      icon: Settings,                            teacherAllowed: true },
  { href: '/admin/ghid',         label: 'Ghid',        icon: BookOpen,                            teacherAllowed: true },
];

const BARS = [38, 78, 50, 100, 66, 88, 42, 72];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [newRegistrations, setNewRegistrations] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (role !== 'admin') return;
    const load = () => fetch('/api/users?status=pending').then(r => r.json()).then(d => setPendingCount((d.users ?? []).length)).catch(() => {});
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [role]);

  useEffect(() => {
    if (role !== 'admin') return;
    const load = () => fetch('/api/registrations?status=nou').then(r => r.json()).then(d => setNewRegistrations((d.registrations ?? []).length)).catch(() => {});
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [role]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

  return (
    <aside style={{
      width: 256, minWidth: 256, height: '100vh', position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--ink)', zIndex: 30, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 2, height: 38, minWidth: 48, flexShrink: 0,
          padding: '5px 9px 4px',
          background: 'linear-gradient(145deg, #180c30, #261550)',
          borderRadius: 11,
          border: '1px solid rgba(201,160,32,0.38)',
          boxShadow: '0 0 16px rgba(201,160,32,0.14)',
        }}>
          {BARS.map((h, i) => (
            <div key={i} style={{
              width: 2.5, borderRadius: 2, height: `${h}%`,
              background: 'linear-gradient(to top, var(--gold-dark), var(--gold))',
              animation: `crm-bar ${0.65 + (i % 4) * 0.14}s ease-in-out ${i * 0.09}s infinite alternate`,
              transformOrigin: 'bottom',
            }} />
          ))}
        </div>
        <div>
          <p style={{ fontWeight: 800, color: '#fff', fontSize: 14, lineHeight: 1.2, margin: 0, letterSpacing: '-0.01em' }}>
            Arry Production
          </p>
          <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 9.5, margin: '2px 0 0', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            CRM
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {nav.filter(n => {
          if (role === 'student') return n.studentAllowed === true;
          if (role === 'teacher') return n.teacherAllowed === true;
          if (n.adminOnly) return role === 'admin';
          return true;
        }).map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const showBadge = (href === '/admin/users' && pendingCount > 0) || (href === '/registrations' && newRegistrations > 0);
          const badgeCount = href === '/admin/users' ? pendingCount : newRegistrations;
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 12px', borderRadius: 12,
              fontSize: 13.5, fontWeight: active ? 600 : 500, textDecoration: 'none',
              color: active ? '#fff' : 'rgba(255,255,255,0.52)',
              background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
              transition: 'all 0.18s',
            }}>
              <Icon style={{ width: 16, height: 16, flexShrink: 0, color: active ? 'var(--gold)' : 'rgba(255,255,255,0.32)' }} />
              {label}
              {showBadge ? (
                <span style={{
                  marginLeft: 'auto', minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10,
                  background: 'var(--gold)', color: '#0a0a0a',
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{badgeCount}</span>
              ) : active ? (
                <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '10px 12px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <a href={siteUrl} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 12,
          fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
          color: 'rgba(255,255,255,0.42)', transition: 'all 0.18s',
        }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.05)'; el.style.color = 'rgba(255,255,255,0.8)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'rgba(255,255,255,0.42)'; }}>
          <ExternalLink style={{ width: 16, height: 16, flexShrink: 0 }} />
          Vezi site-ul
        </a>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 12px', borderRadius: 12,
          fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
          color: 'rgba(255,255,255,0.42)', background: 'none', border: 'none', textAlign: 'left',
          transition: 'all 0.18s',
        }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(239,68,68,0.1)'; el.style.color = 'rgba(252,165,165,0.9)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'rgba(255,255,255,0.42)'; }}>
          <LogOut style={{ width: 16, height: 16, flexShrink: 0 }} />
          Deconectare
        </button>
      </div>

      <style>{`@keyframes crm-bar { 0% { transform: scaleY(0.25); } 100% { transform: scaleY(1); } }`}</style>
    </aside>
  );
}
