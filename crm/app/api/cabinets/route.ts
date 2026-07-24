import { NextRequest, NextResponse } from 'next/server';
import { getCabinets, getCabinetAssignments, createCabinet } from '@/lib/db';

export async function GET() {
  const cabinets = getCabinets();
  const assignments = getCabinetAssignments();
  return NextResponse.json({ cabinets, assignments });
}

export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json();
    if (!name) return NextResponse.json({ error: 'Numele cabinetului este obligatoriu' }, { status: 400 });

    const cabinet = createCabinet({ name, color: color ?? '#6366f1' });
    return NextResponse.json({ cabinet }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
