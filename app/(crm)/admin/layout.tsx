import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
