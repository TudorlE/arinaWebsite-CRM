import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { updateUserRole, getUserById } from '@/lib/db';

// Only teacher / student can be assigned via UI. 'admin' is intentionally NOT assignable
// from the API — must be set manually in the database.
const ASSIGNABLE_ROLES = ['teacher', 'student'];

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const target = getUserById(userId);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Prevent demoting other admins via the role select
  if ((target as { role?: string }).role === 'admin' && userId !== auth.userId) {
    return NextResponse.json({ error: 'Nu poți schimba rolul unui admin' }, { status: 403 });
  }

  const body = await request.json();
  const { role } = body;

  if (!ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Rolul trebuie să fie teacher sau student' }, { status: 400 });
  }

  const updated = updateUserRole(userId, role);
  return NextResponse.json({ user: updated });
}
