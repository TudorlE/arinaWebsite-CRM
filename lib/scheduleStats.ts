/**
 * Single source of truth for monthly Elevi/Profesori statistics.
 * Everything is computed live from `lessons`/`attendance` — nothing is
 * stored or cached, so stats are automatically in sync with Program.
 */
import { supabase } from '@/lib/supabase';
import { MonthlyStats, StudentSubscription } from '@/lib/types';

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
  replacement_teacher_id: number | null;
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
  replacement_teacher_id: number | null;
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
      replacement_teacher_id: l.replacement_teacher_id ?? null,
    };
  });
}

const LESSON_SELECT = 'id, student_id, teacher_id, discipline, status, replacement_teacher_id, students(name), teachers!lessons_teacher_id_fkey(name), attendance(status)';

export async function getLessonsInMonth(month: string, filters: StatsFilters = {}): Promise<StatsLessonRow[]> {
  const { from, to } = monthRange(month);
  let query = supabase
    .from('lessons')
    .select(LESSON_SELECT)
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
    .select(LESSON_SELECT);

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

export interface StudentDisciplineStats {
  student_id: number;
  discipline: string;
  teacher_id: number;
  teacher_name?: string;
  total: number;
  /** Counts as "done" the same way the register does: completed status OR a present attendance mark. */
  done: number;
  recovered: number;
  excused_absence: number;
  unexcused_absence: number;
}

/**
 * Elevi Frecvență needs a per-instrument breakdown, not one lump total per
 * student — a student with Canto + Piano shouldn't show "40 lecții", they
 * should show 8 at Canto and however many at Piano, separately.
 */
export function aggregateByStudentAndDiscipline(rows: StatsLessonRow[]): StudentDisciplineStats[] {
  const map = new Map<string, StudentDisciplineStats>();
  for (const r of rows) {
    const discipline = r.discipline ?? '—';
    const key = `${r.student_id}|${discipline}`;
    if (!map.has(key)) {
      map.set(key, {
        student_id: r.student_id, discipline,
        teacher_id: r.teacher_id, teacher_name: r.teacher_name ?? undefined,
        total: 0, done: 0, recovered: 0, excused_absence: 0, unexcused_absence: 0,
      });
    }
    const entry = map.get(key)!;
    entry.total++;
    if (r.status === 'completed' || r.attendance_status === 'present') entry.done++;
    if (r.status === 'recovered') entry.recovered++;
    if (r.attendance_status === 'excused_absence') entry.excused_absence++;
    else if (r.attendance_status === 'unexcused_absence') entry.unexcused_absence++;
  }
  return Array.from(map.values());
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

/**
 * When a lesson was covered by a substitute (`replacement_teacher_id` set),
 * it's attributed to whoever actually taught it — the substitute — not the
 * originally-assigned teacher. The substitute's `replaced` counter tracks
 * how many lessons they covered for someone else (+1 to whoever DID the
 * replacement, not the teacher who was replaced).
 */
export function aggregateByTeacher(rows: StatsLessonRow[]): MonthlyStats[] {
  const map = new Map<number, MonthlyStats & { studentSet: Set<string> }>();
  const ensure = (teacherId: number, teacherName: string | null) => {
    if (!map.has(teacherId)) {
      map.set(teacherId, {
        teacher_id: teacherId, teacher_name: teacherName ?? undefined,
        ...blankCounts(), replaced: 0,
        studentSet: new Set<string>(),
      });
    }
    return map.get(teacherId)!;
  };
  for (const r of rows) {
    const effectiveId = r.replacement_teacher_id ?? r.teacher_id;
    const entry = ensure(effectiveId, effectiveId === r.teacher_id ? r.teacher_name : null);
    tallyLesson(entry, r);
    if (r.student_name) entry.studentSet.add(r.student_name);
    if (r.replacement_teacher_id) {
      entry.replaced!++;
    }
  }
  return Array.from(map.values())
    .map(({ studentSet, ...rest }) => ({ ...rest, students: Array.from(studentSet).sort() }))
    .sort((a, b) => (a.teacher_name ?? '').localeCompare(b.teacher_name ?? ''));
}

/**
 * Profesori Frecvență (dedicated to this page — leaves aggregateByTeacher()
 * alone since that one still backs the lifetime teacher-summary popup).
 *
 * `total` here is NOT a count of lesson rows — it's how many lessons SHOULD
 * happen this month, derived from the "lecții/lună" on each active student's
 * subscription with this teacher. `completed`/`recovered` are actual counts
 * from `lessons`, meant purely as a comparison against that expected total.
 * A teacher shows up even with zero lesson rows this month, as long as they
 * have at least one active assigned student — that's precisely the gap this
 * view is meant to surface.
 */
export async function computeTeacherWorkload(month: string, filters: StatsFilters = {}): Promise<MonthlyStats[]> {
  const rows = await getLessonsInMonth(month, { teacherId: filters.teacherId, discipline: filters.discipline });

  const [{ data: teachersData }, { data: studentsData }] = await Promise.all([
    supabase.from('teachers').select('id, name'),
    supabase.from('students').select('id, name, status, subscriptions'),
  ]);
  const teacherNameMap = new Map<number, string>((teachersData ?? []).map((t: { id: number; name: string }) => [t.id, t.name]));

  type StudentRow = { id: number; name: string; status: string | null; subscriptions: StudentSubscription[] | null };
  const expected = new Map<number, number>();
  const studentsByTeacher = new Map<number, Set<string>>();
  const addStudent = (teacherId: number, name: string) => {
    if (!studentsByTeacher.has(teacherId)) studentsByTeacher.set(teacherId, new Set());
    studentsByTeacher.get(teacherId)!.add(name);
  };
  for (const s of (studentsData ?? []) as StudentRow[]) {
    if ((s.status ?? 'active') !== 'active') continue; // paused/inactive students aren't expected to attend
    for (const sub of s.subscriptions ?? []) {
      if (!sub.teacher_id) continue;
      if (filters.teacherId && sub.teacher_id !== filters.teacherId) continue;
      if (filters.discipline && sub.instrument !== filters.discipline) continue;
      if ((sub.status ?? 'active') !== 'active') continue;
      expected.set(sub.teacher_id, (expected.get(sub.teacher_id) ?? 0) + (Number(sub.lessons) || 0));
      addStudent(sub.teacher_id, s.name);
    }
  }

  // A substituted lesson's actual delivery (completed/recovered/absence) counts
  // toward the substitute's own workload, not the originally-assigned teacher's
  // — and the substitute's `replaced` tally credits THEM for covering it
  // (+1 to whoever did the replacement, not the teacher who was replaced).
  const tallies = new Map<number, { completed: number; recovered: number; excused_absence: number; unexcused_absence: number; replaced: number }>();
  const ensureTally = (teacherId: number) => {
    if (!tallies.has(teacherId)) tallies.set(teacherId, { completed: 0, recovered: 0, excused_absence: 0, unexcused_absence: 0, replaced: 0 });
    return tallies.get(teacherId)!;
  };
  // Per-teacher breakdown of WHICH students had an excused absence, and how
  // many times — surfaced when clicking "Motivate" in Profesori Frecvență.
  const excusedByTeacher = new Map<number, Map<string, number>>();
  for (const r of rows) {
    const effectiveId = r.replacement_teacher_id ?? r.teacher_id;
    const t = ensureTally(effectiveId);
    if (r.status === 'completed') t.completed++;
    else if (r.status === 'recovered') t.recovered++;
    if (r.attendance_status === 'excused_absence') {
      t.excused_absence++;
      if (r.student_name) {
        const m = excusedByTeacher.get(effectiveId) ?? new Map<string, number>();
        m.set(r.student_name, (m.get(r.student_name) ?? 0) + 1);
        excusedByTeacher.set(effectiveId, m);
      }
    }
    else if (r.attendance_status === 'unexcused_absence') t.unexcused_absence++;
    if (r.student_name) addStudent(effectiveId, r.student_name);
    if (r.replacement_teacher_id) {
      t.replaced++;
    }
  }

  const teacherIds = new Set<number>([...expected.keys(), ...tallies.keys()]);
  const out: MonthlyStats[] = [];
  for (const id of teacherIds) {
    const tal = tallies.get(id) ?? { completed: 0, recovered: 0, excused_absence: 0, unexcused_absence: 0, replaced: 0 };
    const excusedMap = excusedByTeacher.get(id);
    out.push({
      teacher_id: id,
      teacher_name: teacherNameMap.get(id) ?? undefined,
      total: expected.get(id) ?? 0,
      scheduled: 0, cancelled: 0, present: 0,
      completed: tal.completed,
      recovered: tal.recovered,
      excused_absence: tal.excused_absence,
      unexcused_absence: tal.unexcused_absence,
      replaced: tal.replaced,
      students: Array.from(studentsByTeacher.get(id) ?? []).sort(),
      excused_students: excusedMap
        ? Array.from(excusedMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        : [],
    });
  }
  return out.sort((a, b) => (a.teacher_name ?? '').localeCompare(b.teacher_name ?? ''));
}
