import CrmShell from '@/components/CrmShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <CrmShell>{children}</CrmShell>;
}
