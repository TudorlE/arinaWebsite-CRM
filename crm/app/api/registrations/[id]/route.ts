import { NextRequest, NextResponse } from 'next/server';
import { updateRegistrationStatus, deleteRegistration } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { status } = await request.json();
  const registration = updateRegistrationStatus(Number(id), status);
  if (!registration) return NextResponse.json({ error: 'Nu s-a găsit' }, { status: 404 });
  return NextResponse.json({ registration });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  deleteRegistration(Number(id));
  return NextResponse.json({ success: true });
}
