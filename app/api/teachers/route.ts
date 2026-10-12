import { NextRequest, NextResponse } from 'next/server';
import { supabase, friendlyDbError } from '@/lib/supabase';
import { getAuthContext, requireRole } from '@/lib/roleGuard';

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'administrator', 'teacher', 'student']);
  if (forbidden) return forbidden;

  const { data, error } = await supabase.from('teachers').select('*').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ teachers: data });
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'administrator']);
  if (forbidden) return forbidden;

  try {
    const { name, email, phone, bio, birth_date, instruments } = await request.json();
    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('teachers')
      .insert({ name, email, phone, bio, birth_date: birth_date || null, instruments: instruments ?? [] })
      .select()
      .single();
    if (error) return NextResponse.json({ error: friendlyDbError(error) }, { status: 400 });
    return NextResponse.json({ teacher: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
