import { NextRequest, NextResponse } from 'next/server';
import { updateCabinet, deleteCabinet } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ['name', 'color'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    const cabinet = updateCabinet(Number(id), update);
    if (!cabinet) return NextResponse.json({ error: 'Cabinet negăsit' }, { status: 404 });
    return NextResponse.json({ cabinet });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  deleteCabinet(Number(id));
  return NextResponse.json({ success: true });
}
