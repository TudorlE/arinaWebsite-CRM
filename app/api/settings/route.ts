import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { getUserById, updateUserPassword } from '@/lib/db';

/** PUT /api/settings/password — change admin password */
export async function PUT(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both fields required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = getUserById(auth.userId) as { id: number; password_hash?: string } | undefined;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // We need password_hash — re-fetch with hash
    const { getUserByEmail } = await import('@/lib/db');
    const fullUser = getUserByEmail(auth.email);
    if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, fullUser.password_hash);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    const newHash = await bcrypt.hash(newPassword, 10);
    updateUserPassword(auth.userId, newHash);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
