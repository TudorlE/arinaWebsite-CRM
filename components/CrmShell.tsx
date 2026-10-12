'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import StudentTopNav from '@/components/StudentTopNav';

/**
 * Picks the CRM's chrome by role: the usual sidebar for everyone, or — for a
 * student, whose reachable surface is exactly two pages (enforced server-side
 * by proxy.ts) — a dedicated top nav with no sidebar and no "Arry Studio"
 * branding, requested explicitly as a simpler, more personal experience.
 * Defaults to the sidebar while the role is still loading (same brief flash
 * the sidebar's own nav-item filtering already has today), only swapping to
 * the student layout once the role is confirmed.
 */
export default function CrmShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);

  if (role === 'student') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--cream)' }}>
        <StudentTopNav />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--cream)' }}>
      <Sidebar />
      {/* pt-16 clears the fixed hamburger/section-icon button now that PageBanner
          (which used to push content below it) is hidden on phone/tablet. */}
      <div className="pt-16 lg:pt-0" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
