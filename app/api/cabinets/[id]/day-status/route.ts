import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabase.from('cabinet_day_status').select('*').eq('cabinet_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ dayStatuses: data ?? [] });
}

/** Ocupat/Liber is a manual flag, editable any time — no locking after save. */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const { day_of_week, status } = await request.json();
    if (day_of_week === undefined || day_of_week === null || !['liber', 'ocupat'].includes(status)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('cabinet_day_status')
      .upsert(
        { cabinet_id: Number(id), day_of_week: Number(day_of_week), status, updated_at: new Date().toISOString() },
        { onConflict: 'cabinet_id,day_of_week' },
      )
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ dayStatus: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
