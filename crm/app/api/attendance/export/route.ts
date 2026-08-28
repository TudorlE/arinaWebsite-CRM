import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireRole, restrictToOwnTeacher } from '@/lib/roleGuard';
import { buildAttendanceQuery } from '../route';

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Feature 7: CSV export (opens correctly in Excel with a UTF-8 BOM for diacritics). */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  const forbidden = requireRole(ctx, ['admin', 'teacher']);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = buildAttendanceQuery(request, status);
  if (ctx!.role === 'teacher') {
    const guard = restrictToOwnTeacher(ctx!);
    if (guard) return guard;
    query = query.eq('teacher_id', ctx!.teacherId!);
  }
  query = query.range(0, 4999); // sane export cap

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = {
    date: string; time: string; discipline: string | null;
    students: { name: string } | null; teachers: { name: string } | null;
    attendance: { status: string; notes: string | null } | { status: string; notes: string | null }[] | null;
  };

  const header = ['Elev', 'Disciplină', 'Profesor', 'Data lecției', 'Prezent', 'Absent', 'Absență motivată', 'Absență nemotivată', 'Întârziere', 'Comentarii'];
  const lines = [header.map(csvEscape).join(',')];

  for (const l of (data ?? []) as unknown as Row[]) {
    const att = Array.isArray(l.attendance) ? l.attendance[0] : l.attendance;
    const mark = (want: string) => (att?.status === want ? 'X' : '');
    lines.push([
      l.students?.name ?? '',
      l.discipline ?? '',
      l.teachers?.name ?? '',
      `${l.date} ${l.time?.slice(0, 5) ?? ''}`,
      mark('present'),
      mark('absent'),
      mark('excused_absence'),
      mark('unexcused_absence'),
      mark('late'),
      att?.notes ?? '',
    ].map(csvEscape).join(','));
  }

  const csv = '﻿' + lines.join('\r\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="registru-frecventa-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
