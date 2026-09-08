import { NextRequest, NextResponse } from 'next/server';
import { supabase, friendlyDbError } from '@/lib/supabase';
import { createPaymentForStudent } from '@/lib/payments';
import { withTeacherNames } from '@/lib/pricing';
import type { StudentSubscription } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search     = searchParams.get('search');
  const instrument = searchParams.get('instrument');
  const level      = searchParams.get('level');

  let query = supabase
    .from('students')
    .select('*, teachers(name), cabinets(name)')
    .order('name');

  if (instrument) query = query.contains('instruments', [instrument]);
  if (level)      query = query.eq('level', level);
  if (search)     query = query.ilike('name', `%${search}%`);

  const [{ data, error }, { data: teachersData }] = await Promise.all([
    query,
    supabase.from('teachers').select('id, name'),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const teacherMap = new Map<number, string>((teachersData ?? []).map((t: { id: number; name: string }) => [t.id, t.name]));

  const students = (data ?? []).map(({ teachers, cabinets, subscriptions, ...s }: { teachers: { name: string } | null; cabinets: { name: string } | null; subscriptions?: StudentSubscription[]; [key: string]: unknown }) => ({
    ...s,
    teacher_name: teachers?.name ?? null,
    cabinet_name: cabinets?.name ?? null,
    subscriptions: withTeacherNames(subscriptions, teacherMap),
  }));

  return NextResponse.json({ students });
}

export async function POST(request: NextRequest) {
  try {
    const {
      name, birth_date, phone, email, instruments, level, monthly_fee, subscriptions,
      parent_name, parent_phone, teacher_id, cabinet_id, notes, status,
    } = await request.json();
    // Only the name and at least one instrument are required — everything else is optional.
    if (!name?.trim() || !instruments?.length) {
      return NextResponse.json({ error: 'Numele și cel puțin un instrument sunt obligatorii' }, { status: 400 });
    }

    const baseInsert = {
      name: name.trim(),
      birth_date: birth_date || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      instruments,
      level: level ?? 'beginner',
      monthly_fee: Number(monthly_fee) || 0,
      teacher_id: teacher_id ? Number(teacher_id) : null,
      cabinet_id: cabinet_id ? Number(cabinet_id) : null,
      notes: notes ?? null,
      status: status ?? 'active',
    };
    const fullInsert = {
      ...baseInsert,
      subscriptions: subscriptions ?? [],
      parent_name: parent_name?.trim() || null,
      parent_phone: parent_phone?.trim() || null,
    };

    let { data: student, error } = await supabase.from('students').insert(fullInsert).select().single();
    // subscriptions/parent_name/parent_phone columns not migrated yet — retry without them.
    if (error && /subscriptions|parent_name|parent_phone/.test(error.message)) {
      ({ data: student, error } = await supabase.from('students').insert(baseInsert).select().single());
    }
    if (error) return NextResponse.json({ error: friendlyDbError(error) }, { status: 400 });

    // Automation: auto-create the current month "unpaid" payment for the new student.
    if (student?.id && baseInsert.monthly_fee > 0) {
      try { await createPaymentForStudent(Number(student.id), baseInsert.monthly_fee); } catch { /* non-fatal */ }
    }
    return NextResponse.json({ student }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
