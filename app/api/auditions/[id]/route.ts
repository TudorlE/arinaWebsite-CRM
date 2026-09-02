import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole } from '@/lib/roleGuard';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { id } = await params;
  const { data, error } = await supabase.from('auditions').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Audition not found' }, { status: 404 });

  return NextResponse.json({ audition: data });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ['candidate_name', 'discipline', 'date', 'time', 'duration', 'notes', 'result', 'status'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await supabase.from('auditions').update(update).eq('id', id).select().single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? 'Audition not found' }, { status: 404 });
    return NextResponse.json({ audition: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { id } = await params;
  const { error } = await supabase.from('auditions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
