import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { status } = await request.json();
  const { data, error } = await supabase.from('registrations').update({ status }).eq('id', id).select().single();
  if (error || !data) return NextResponse.json({ error: 'Nu s-a găsit' }, { status: 404 });
  return NextResponse.json({ registration: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { error } = await supabase.from('registrations').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
