import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole } from '@/lib/roleGuard';

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const discipline = searchParams.get('discipline');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let query = supabase
    .from('auditions')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (discipline) query = query.eq('discipline', discipline);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let auditions = data ?? [];
  if (search) {
    const q = search.toLowerCase();
    auditions = auditions.filter((a: { candidate_name?: string | null }) => (a.candidate_name ?? '').toLowerCase().includes(q));
  }

  return NextResponse.json({ auditions });
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  try {
    const { candidate_name, discipline, date, time, duration, notes, result, status } = await request.json();
    if (!candidate_name || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('auditions')
      .insert({
        candidate_name,
        discipline: discipline ?? null,
        date, time,
        duration: duration ? Number(duration) : 30,
        notes: notes ?? null,
        result: result ?? null,
        status: status ?? 'scheduled',
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ audition: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
