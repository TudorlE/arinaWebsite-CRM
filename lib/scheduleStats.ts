/**
 * Single source of truth for monthly Elevi/Profesori statistics.
 * Everything is computed live from `lessons`/`attendance` — nothing is
 * stored or cached, so stats are automatically in sync with Program.
 */
import { supabase } from '@/lib/supabase';
import { MonthlyStats } from '@/lib/types';

export interface StatsFilters {
  studentId?: number;
  teacherId?: number;
  discipline?: string;
}

export interface StatsLessonRow {
  id: number;
  student_id: number;
  student_name: string | null;
  teacher_id: number;
  teacher_name: string | null;
  discipline: string | null;
  status: string;
  attendance_status: string | null;
}

function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

type EmbeddedLessonRow = {
  id: number; student_id: number; teacher_id: number; discipline: string | null; status: string;
  students: { name: string } | null;
  teachers: { name: string } | null;
  attendance: { status: string } | { status: string }[] | null;
};

function mapLessonRows(data: unknown): StatsLessonRow[] {
  return ((data ?? []) as EmbeddedLessonRow[]).map(l => {
    const att = Array.isArray(l.attendance) ? l.attendance[0] : l.attendance;
    return {
      id: l.id,
      student_id: l.student_id,
      student_name: l.students?.name ?? null,
      teacher_id: l.teacher_id,
      teacher_name: l.teachers?.name ?? null,
      discipline: l.discipline,
      status: l.status,
      attendance_status: att?.status ?? null,
    };
  });
}

export async function getLessonsInMonth(month: string, filters: StatsFilters = {}): Promise<StatsLessonRow[]> {
  const { from, to } = monthRange(month);
  let query = supabase
    .from('lessons')
    .select('id, student_id, teacher_id, discipline, status, students(name), teachers(name), attendance(status)')
    .gte('date', from)
    .lte('date', to);

  if (filters.studentId) query = query.eq('student_id', filters.studentId);
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);
  if (filters.discipline) query = query.eq('discipline', filters.discipline);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return mapLessonRows(data);
}

/** Same as getLessonsInMonth but with no date bound — lifetime totals (used by the details popups). */
export async function getAllLessons(filters: StatsFilters = {}): Promise<StatsLessonRow[]> {
  let query = supabase
    .from('lessons')
    .select('id, student_id, teacher_id, discipline, status, students(name), teachers(name), attendance(status)');

  if (filters.studentId) query = query.eq('student_id', filters.studentId);
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);
  if (filters.discipline) query = query.eq('discipline', filters.discipline);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return mapLessonRows(data);
}

function blankCounts() {
  return { total: 0, scheduled: 0, completed: 0, cancelled: 0, recovered: 0, present: 0, excused_absence: 0, unexcused_absence: 0 };
}

function tallyLesson(counts: ReturnType<typeof blankCounts>, r: StatsLessonRow) {
  counts.total++;
  if (r.status === 'scheduled') counts.scheduled++;
  else if (r.status === 'completed') counts.completed++;
  else if (r.status === 'cancelled') counts.cancelled++;
  else if (r.status === 'recovered') counts.recovered++;
  if (r.attendance_status === 'present') counts.present++;
  else if (r.attendance_status === 'excused_absence') counts.excused_absence++;
  else if (r.attendance_status === 'unexcused_absence') counts.unexcused_absence++;
}

export function aggregateByStudent(rows: StatsLessonRow[]): MonthlyStats[] {
  const map = new Map<number, MonthlyStats>();
  for (const r of rows) {
    if (!map.has(r.student_id)) {
      map.set(r.student_id, {
        student_id: r.student_id, student_name: r.student_name ?? undefined,
        teacher_id: r.teacher_id, teacher_name: r.teacher_name ?? undefined,
        discipline: r.discipline,
        ...blankCounts(),
      });
    }
    tallyLesson(map.get(r.student_id)!, r);
  }
  return Array.from(map.values()).sort((a, b) => (a.student_name ?? '').localeCompare(b.student_name ?? ''));
}

export function aggregateByTeacher(rows: StatsLessonRow[]): MonthlyStats[] {
  const map = new Map<number, MonthlyStats & { studentSet: Set<string> }>();
  for (const r of rows) {
    if (!map.has(r.teacher_id)) {
      map.set(r.teacher_id, {
        teacher_id: r.teacher_id, teacher_name: r.teacher_name ?? undefined,
        ...blankCounts(),
        studentSet: new Set<string>(),
      });
    }
    const entry = map.get(r.teacher_id)!;
    tallyLesson(entry, r);
    if (r.student_name) entry.studentSet.add(r.student_name);
  }
  return Array.from(map.values())
    .map(({ studentSet, ...rest }) => ({ ...rest, students: Array.from(studentSet).sort() }))
    .sort((a, b) => (a.teacher_name ?? '').localeCompare(b.teacher_name ?? ''));
}
