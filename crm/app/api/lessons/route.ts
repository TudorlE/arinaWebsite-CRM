import { NextRequest, NextResponse } from 'next/server';
import { getLessons, createLesson } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const date      = searchParams.get('date');
  const status    = searchParams.get('status');
  const teacherId = searchParams.get('teacher_id');
  const cabinetId = searchParams.get('cabinet_id');

  const lessons = getLessons(
    studentId ? Number(studentId) : undefined,
    date ?? undefined,
    status ?? undefined,
    teacherId ? Number(teacherId) : undefined,
    cabinetId ? Number(cabinetId) : undefined,
  );

  return NextResponse.json({ lessons });
}

export async function POST(request: NextRequest) {
  try {
    const { student_id, teacher_id, date, time, duration, notes, cabinet_id } = await request.json();
    if (!student_id || !teacher_id || !date || !time || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const lesson = createLesson({
      student_id: Number(student_id),
      teacher_id: Number(teacher_id),
      date, time,
      duration: Number(duration),
      notes: notes ?? null,
      cabinet_id: cabinet_id ? Number(cabinet_id) : null,
    });
    return NextResponse.json({ lesson }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
