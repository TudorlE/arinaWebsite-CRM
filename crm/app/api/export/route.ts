import { NextRequest, NextResponse } from 'next/server';
import { getStudents, getLessons, getPayments } from '@/lib/db';

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
    const students = getStudents() as Record<string, unknown>[];
    csv = toCSV(students, ['id', 'name', 'age', 'phone', 'email', 'instrument', 'level', 'monthly_fee', 'teacher_name', 'created_at']);
    filename = 'students.csv';
  } else if (type === 'lessons') {
    const lessons = getLessons() as Record<string, unknown>[];
    csv = toCSV(lessons, ['id', 'student_name', 'teacher_name', 'date', 'time', 'duration', 'status', 'notes', 'created_at']);
    filename = 'lessons.csv';
  } else if (type === 'payments') {
    const payments = getPayments() as Record<string, unknown>[];
    csv = toCSV(payments, ['id', 'student_name', 'amount', 'month', 'year', 'status', 'payment_date', 'notes', 'created_at']);
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
