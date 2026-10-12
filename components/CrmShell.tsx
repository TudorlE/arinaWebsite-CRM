import Sidebar from '@/components/Sidebar';
import StudentTopNav from '@/components/StudentTopNav';

/**
 * Picks the CRM's chrome by role: the usual sidebar for everyone, or — for a
 * student, whose reachable surface is exactly two pages (enforced server-side
 * by proxy.ts) — a dedicated top nav with no sidebar and no "Arry Studio"
 * branding, requested explicitly as a simpler, more personal experience.
 *
 * `role`/`name` arrive from the parent (Server Component) layout, which reads
 * them from the request headers proxy.ts already set — resolved before this
 * ever reaches the browser, so there's no client-side fetch and no flash of
 * the wrong chrome while a role is "still loading".
 */
export default function CrmShell({ children, role, name }: { children: React.ReactNode; role: string | null; name: string }) {
  if (role === 'student') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--cream)' }}>
        <StudentTopNav name={name} />
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
