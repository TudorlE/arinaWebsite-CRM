import { NextRequest, NextResponse } from 'next/server';
import { getTeachers, createTeacher } from '@/lib/db';

export async function GET() {
  const teachers = getTeachers();
  return NextResponse.json({ teachers });
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, bio } = await request.json();
    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const teacher = createTeacher({ name, email, phone, bio });
    return NextResponse.json({ teacher }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
