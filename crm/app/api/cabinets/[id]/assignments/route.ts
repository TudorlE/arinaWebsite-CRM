import { NextRequest, NextResponse } from 'next/server';
import { getCabinetAssignments, upsertCabinetAssignment, deleteCabinetAssignment } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const assignments = getCabinetAssignments(Number(id));
  return NextResponse.json({ assignments });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const { day_of_week, teacher_id } = await request.json();

    if (teacher_id === null || teacher_id === '') {
      deleteCabinetAssignment(Number(id), Number(day_of_week));
      return NextResponse.json({ assignment: null });
    }

    const assignment = upsertCabinetAssignment(Number(id), Number(day_of_week), Number(teacher_id));
    return NextResponse.json({ assignment });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
