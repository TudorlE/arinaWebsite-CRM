import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { updateUserRole, getUserById, deleteUser, linkStudent, unlinkStudent } from '@/lib/users';

// Only teacher / student / administrator can be assigned via UI. 'admin' (the founder
// account) is intentionally NOT assignable from the API — must be set manually in the database.
const ASSIGNABLE_ROLES = ['teacher', 'student', 'administrator'];

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const target = await getUserById(userId);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Prevent demoting other admins via the role select
  if ((target as { role?: string }).role === 'admin' && userId !== auth.userId) {
    return NextResponse.json({ error: 'Nu poți schimba rolul unui admin' }, { status: 403 });
  }

  const body = await request.json();
  const { role, teacher_id, student_id } = body;

  if (!ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Rolul trebuie să fie profesor, elev sau administrator' }, { status: 400 });
  }

  const updated = await updateUserRole(
    userId, role,
    teacher_id !== undefined ? (teacher_id ? Number(teacher_id) : null) : undefined,
    student_id !== undefined ? (student_id ? Number(student_id) : null) : undefined,
  );
  return NextResponse.json({ user: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  if (userId === auth.userId) return NextResponse.json({ error: 'Nu îți poți șterge propriul cont' }, { status: 403 });

  const target = await getUserById(userId);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if ((target as { role?: string }).role === 'admin') {
    return NextResponse.json({ error: 'Un cont de Fondator nu poate fi șters din UI' }, { status: 403 });
  }

  await deleteUser(userId);
  return NextResponse.json({ success: true });
}

/**
 * Links or unlinks an ADDITIONAL student fișă to an already-approved student
 * account — e.g. two siblings sharing one parent login. The first/primary
 * fișă is still set via PUT above; this only adds/removes extra ones on top.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const target = await getUserById(userId);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.role !== 'student') return NextResponse.json({ error: 'Doar conturile de elev pot fi legate de mai multe fișe' }, { status: 400 });

  const body = await request.json();
  const studentId = Number(body.student_id);
  if (!studentId) return NextResponse.json({ error: 'student_id invalid' }, { status: 400 });

  try {
    if (body.action === 'link_student') {
      await linkStudent(userId, studentId);
    } else if (body.action === 'unlink_student') {
      await unlinkStudent(userId, studentId);
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Eroare' }, { status: 500 });
  }

  const updated = await getUserById(userId);
  return NextResponse.json({ user: updated });
}
