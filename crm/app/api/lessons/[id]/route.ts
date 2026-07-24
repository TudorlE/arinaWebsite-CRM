import { NextRequest, NextResponse } from 'next/server';
import { getLessonById, updateLesson, deleteLesson } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const lesson = getLessonById(Number(id));
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  return NextResponse.json({ lesson });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ['student_id', 'teacher_id', 'date', 'time', 'duration', 'status', 'notes', 'cabinet_id'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    const lesson = updateLesson(Number(id), update);
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    return NextResponse.json({ lesson });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  deleteLesson(Number(id));
  return NextResponse.json({ success: true });
}
