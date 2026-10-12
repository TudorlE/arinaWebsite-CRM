import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { getUserByEmail, updateUserPassword } from '@/lib/users';

/** PUT /api/settings/password — change the signed-in user's own password */
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

    const fullUser = await getUserByEmail(auth.email);
    if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!fullUser.password_hash) {
      return NextResponse.json({ error: 'Acest cont e autentificat prin Google și nu are o parolă de schimbat.' }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, fullUser.password_hash);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    const newHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(auth.userId, newHash);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
