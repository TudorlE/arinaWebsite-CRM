import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getUserById } from '@/lib/users';

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserById(auth.userId);
  // A status change (rejected, or not yet approved) after the cookie was
  // issued must take effect immediately — never trust the week-old token alone.
  if (!user || user.status !== 'approved') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({ user });
}
