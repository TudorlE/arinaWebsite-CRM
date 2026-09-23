import { supabase } from '@/lib/supabase';

/** The embedded select every lesson read uses (students, both teachers, cabinet, attendance). */
export const LESSON_SELECT = '*, students(name), teachers!lessons_teacher_id_fkey(name), replacement:teachers!lessons_replacement_teacher_id_fkey(name), cabinets(name, color), attendance(status, notes)';

type Att = { status: string; notes: string | null };
type Named = { name: string } | { name: string }[] | null;
type Row = { students: Named; teachers: Named; replacement: Named; cabinets: { name: string; color: string } | { name: string; color: string }[] | null; attendance: Att | Att[] | null; [key: string]: unknown };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

/** Flattens an embedded lesson row into the shape the register and other pages use. */
export function shapeLesson({ students, teachers, replacement, cabinets, attendance, ...l }: Row) {
  const att = Array.isArray(attendance) ? attendance[0] : attendance;
  const cab = one(cabinets);
  return {
    ...l,
    student_name: one(students)?.name ?? null,
    teacher_name: one(teachers)?.name ?? null,
    replacement_teacher_name: one(replacement)?.name ?? null,
    cabinet_name: cab?.name ?? null,
    cabinet_color: cab?.color ?? null,
    attendance_status: att?.status ?? null,
    attendance_notes: att?.notes ?? null,
  };
}

/** One lesson, fully shaped (or null). */
export async function fetchShapedLesson(id: number) {
  const { data } = await supabase.from('lessons').select(LESSON_SELECT).eq('id', id).single();
  return data ? shapeLesson(data as unknown as Row) : null;
}
