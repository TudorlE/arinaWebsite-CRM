import { NextRequest, NextResponse } from 'next/server';
import { supabase, friendlyDbError } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('teachers').select('*').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ teachers: data });
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, bio, birth_date } = await request.json();
    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('teachers')
      .insert({ name, email, phone, bio, birth_date: birth_date || null })
      .select()
      .single();
    if (error) return NextResponse.json({ error: friendlyDbError(error) }, { status: 400 });
    return NextResponse.json({ teacher: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
