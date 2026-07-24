import { NextRequest, NextResponse } from 'next/server';
import { getStudents, createStudent } from '@/lib/db';
import { createPaymentForStudent } from '@/lib/payments';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search     = searchParams.get('search') ?? undefined;
  const instrument = searchParams.get('instrument') ?? undefined;
  const level      = searchParams.get('level') ?? undefined;

  const students = getStudents(search, instrument, level);
  return NextResponse.json({ students });
}

export async function POST(request: NextRequest) {
  try {
    const { name, age, phone, email, instruments, level, monthly_fee, teacher_id } = await request.json();
    if (!name || !age || !phone || !email || !instruments?.length || !level || !monthly_fee) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const student = createStudent({
      name, age: Number(age), phone, email, instruments, level,
      monthly_fee: Number(monthly_fee),
      teacher_id: teacher_id ? Number(teacher_id) : null,
    });

    // Automation: auto-create the current month "unpaid" payment for the new student.
    if (student?.id) {
      try { await createPaymentForStudent(Number(student.id), Number(monthly_fee)); } catch { /* non-fatal */ }
    }
    return NextResponse.json({ student }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
