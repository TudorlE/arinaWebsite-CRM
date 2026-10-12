import { headers } from 'next/headers';
import CrmShell from '@/components/CrmShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Set by proxy.ts (already resolved the session there to enforce routing) —
  // read here, server-side, so the right chrome renders on the very first
  // byte of HTML instead of flashing the admin sidebar while a client-side
  // fetch resolves the role.
  const h = await headers();
  const role = h.get('x-user-role');
  const name = decodeURIComponent(h.get('x-user-name') ?? '');

  return <CrmShell role={role} name={name}>{children}</CrmShell>;
}
