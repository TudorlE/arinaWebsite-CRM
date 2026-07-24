import { NextRequest, NextResponse } from 'next/server';
import { getRegistrations, createRegistration } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;

  const registrations = getRegistrations(status);
  return NextResponse.json({ registrations });
}

// Public endpoint — called server-side by the marketing website's registration form.
export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, age, course, message } = await request.json();

    if (!name?.trim() || !phone?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Câmpurile obligatorii lipsesc' }, { status: 400 });
    }

    const registration = createRegistration({
      name, phone, email,
      age: age || null,
      course: course || null,
      message: message || null,
    });

    return NextResponse.json({ registration }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}
