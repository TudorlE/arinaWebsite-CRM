import { headers } from 'next/headers';
import GeneralScheduleClient from '@/components/schedule/GeneralScheduleClient';

export default async function GeneralSchedulePage() {
  // Set by proxy.ts — read here so the role is known before the first byte of
  // HTML, instead of flashing the (student-inappropriate) PageBanner chrome
  // while a client-side /api/auth/me fetch was still resolving.
  const h = await headers();
  const role = h.get('x-user-role');

  return <GeneralScheduleClient role={role} />;
}
