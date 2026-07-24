import { NextRequest, NextResponse } from 'next/server';
import { getStudentById, updateStudent, deleteStudent, getNotesByStudent, createNote, deleteNote } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const student = getStudentById(Number(id));
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const notes = getNotesByStudent(Number(id));
  return NextResponse.json({ student, notes: notes ?? [] });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ['name', 'age', 'phone', 'email', 'instruments', 'level', 'monthly_fee', 'teacher_id'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    const student = updateStudent(Number(id), update);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json({ student });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  deleteStudent(Number(id));
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    if (body.action === 'add_note') {
      const note = createNote(Number(id), body.content);
      return NextResponse.json({ note }, { status: 201 });
    }
    if (body.action === 'delete_note') {
      deleteNote(Number(body.note_id));
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
