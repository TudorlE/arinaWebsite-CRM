import { NextRequest, NextResponse } from 'next/server';
import { getTeacherById, updateTeacher, deleteTeacher } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const teacher = getTeacherById(Number(id));
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  return NextResponse.json({ teacher });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ['name', 'email', 'phone', 'bio'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    const teacher = updateTeacher(Number(id), update);
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json({ teacher });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  deleteTeacher(Number(id));
  return NextResponse.json({ success: true });
}
