/**
 * Server-level route gate for the CRM. Runs before any /admin/**, /login or
 * /register request reaches its page — this is the ONLY place that stops a
 * direct URL hit from an unauthenticated visitor, since none of the (crm)
 * layouts/pages do this themselves (they only hide nav links / UI chrome).
 *
 * Note: in this Next.js version "middleware" was renamed to "proxy" (see
 * node_modules/next/dist/docs/01-app/api-reference/file-conventions/proxy.md).
 * Proxy always runs on the Node.js runtime here, so it's safe to do a real
 * Supabase read (not just decode the JWT) and get the caller's CURRENT role/
 * status rather than whatever was true a week ago when the token was signed.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/users';

// A student's reachable surface is intentionally tiny: their own attendance
// register and the shared general schedule. Everything else under /admin is
// off-limits, per the owner's explicit requirement.
const STUDENT_ALLOWED_PREFIXES = ['/admin/general-schedule', '/admin/attendance'];
const AUTH_PAGES = ['/login', '/register'];

function isUnderPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  const payload = token ? await verifyToken(token) : null;
  const user = payload ? await getUserById(payload.userId) : null;
  const isApproved = !!user && user.status === 'approved';

  if (AUTH_PAGES.includes(pathname)) {
    // An already-approved session has no business seeing the login/register form.
    if (isApproved) return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.next();
  }

  // Everything else matched below is under /admin.
  if (!isApproved) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (token) response.cookies.delete('auth-token');
    return response;
  }

  if (user.role === 'student') {
    const allowed = STUDENT_ALLOWED_PREFIXES.some((prefix) => isUnderPrefix(pathname, prefix));
    if (!allowed) return NextResponse.redirect(new URL('/admin/attendance', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/register'],
};
