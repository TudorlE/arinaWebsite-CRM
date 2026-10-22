import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthContext, requireRole } from '@/lib/roleGuard';
import type { StudentSubscription } from '@/lib/types';

/**
 * Who's in a given Solfegiu group — just names, for the "click a group lesson
 * to see its roster" popup on Program General. That page is a shared board
 * visible to admin/teacher/student/parent alike and already shows every
 * individual lesson's student name to all of them, so a group's member list
 * is no more sensitive than what's already on screen there; unlike
 * /api/students, this intentionally isn't scoped to "my own" students.
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'administrator', 'teacher', 'student']);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const instrument = searchParams.get('instrument');
  const group = searchParams.get('group');
  if (!instrument || !group) {
    return NextResponse.json({ error: 'instrument și group sunt obligatorii' }, { status: 400 });
  }

  const { data, error } = await supabase.from('students').select('id, name, status, subscriptions');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const students = ((data ?? []) as { id: number; name: string; status: string | null; subscriptions: StudentSubscription[] | null }[])
    .filter(s => (s.status ?? 'active') === 'active')
    .filter(s => (s.subscriptions ?? []).some(x =>
      x.instrument === instrument && (x.status ?? 'active') === 'active' && x.group === group,
    ))
    .map(s => ({ id: s.id, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ students });
}
