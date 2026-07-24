import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { approveUser, getUserById } from '@/lib/db';

const ASSIGNABLE_ROLES = ['teacher', 'student'] as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const target = getUserById(userId);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { role } = await request.json();
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Rolul trebuie să fie teacher sau student' }, { status: 400 });
  }

  const updated = approveUser(userId, role);
  return NextResponse.json({ user: updated });
}
