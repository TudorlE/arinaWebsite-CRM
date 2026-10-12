import { headers } from 'next/headers';
import AttendanceRegisterClient from '@/components/attendance/AttendanceRegisterClient';

export default async function AttendanceRegisterPage() {
  // Set by proxy.ts — read here so a student's own role is known before the
  // first byte of HTML, instead of the client briefly rendering the
  // multi-student admin grid while /api/auth/me was still resolving.
  const h = await headers();
  const role = h.get('x-user-role');

  return <AttendanceRegisterClient initialRole={role} />;
}
