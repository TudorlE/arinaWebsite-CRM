import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabase.from('teachers').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  return NextResponse.json({ teacher: data });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ['name', 'email', 'phone', 'bio'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase.from('teachers').update(update).eq('id', id).select().single();
    if (error || !data) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json({ teacher: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { error } = await supabase.from('teachers').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
