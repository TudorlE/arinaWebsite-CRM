import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (val: unknown) => {
    const s = val == null ? '' : String(val);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'students';

  let csv = '';
  let filename = '';

  if (type === 'students') {
    const { data, error } = await supabase.from('students').select('*, teachers(name)').order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = (data ?? []).map(({ teachers, ...s }: { teachers: { name: string } | null; [key: string]: unknown }) => ({
      ...s,
      teacher_name: teachers?.name ?? null,
    }));
    csv = toCSV(rows, ['id', 'name', 'birth_date', 'phone', 'email', 'instruments', 'level', 'monthly_fee', 'teacher_name', 'created_at']);
    filename = 'students.csv';
  } else if (type === 'lessons') {
    const { data, error } = await supabase.from('lessons').select('*, students(name), teachers(name)').order('date', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = (data ?? []).map(({ students, teachers, ...l }: { students: { name: string } | null; teachers: { name: string } | null; [key: string]: unknown }) => ({
      ...l,
      student_name: students?.name ?? null,
      teacher_name: teachers?.name ?? null,
    }));
    csv = toCSV(rows, ['id', 'student_name', 'teacher_name', 'date', 'time', 'duration', 'status', 'notes', 'created_at']);
    filename = 'lessons.csv';
  } else if (type === 'payments') {
    const { data, error } = await supabase.from('payments').select('*, students(name)').order('year', { ascending: false }).order('month', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = (data ?? []).map(({ students, ...p }: { students: { name: string } | null; [key: string]: unknown }) => ({
      ...p,
      student_name: students?.name ?? null,
    }));
    csv = toCSV(rows, ['id', 'student_name', 'amount', 'month', 'year', 'status', 'payment_date', 'notes', 'created_at']);
    filename = 'payments.csv';
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
