/**
 * What a register cell shows for a lesson, in one place. Pure (no imports of
 * runtime code) so it can be unit-tested and shared by the register UI and the
 * payment-credit maths — both must agree on what "M" or "R" means.
 */
export type Mark = 'present' | 'excused_absence' | 'unexcused_absence' | 'cancelled' | 'recovered' | 'replacement';

export interface MarkLesson {
  status: string;
  attendance_status?: string | null;
  replacement_teacher_id?: number | null;
  replacement_teacher_name?: string | null;
  time?: string | null;
  discipline?: string | null;
}

export type Sym = { char: string; className: string; title: string };

export type Outcome = 'replaced' | 'cancelled' | 'recovered' | 'unexcused' | 'excused' | 'late' | 'present' | null;

/**
 * The single outcome of a lesson. A replaced lesson (another teacher taught it)
 * is done automatically, so replacement wins over any letter; otherwise the
 * precedence mirrors what the register has always displayed.
 */
export function outcomeOf(l: MarkLesson): Outcome {
  if (l.replacement_teacher_id) return 'replaced';
  if (l.status === 'cancelled') return 'cancelled';
  if (l.status === 'recovered') return 'recovered';
  if (l.attendance_status === 'unexcused_absence') return 'unexcused';
  if (l.attendance_status === 'excused_absence') return 'excused';
  if (l.attendance_status === 'late') return 'late';
  if (l.status === 'completed' || l.attendance_status === 'present') return 'present';
  return null;
}

const SYMBOLS: Record<Exclude<Outcome, null | 'replaced'>, Sym> = {
  cancelled: { char: 'X', className: 'text-red-700 bg-red-50', title: 'Anulată' },
  recovered: { char: 'R', className: 'text-sky-700 bg-sky-50', title: 'Recuperare' },
  unexcused: { char: 'N', className: 'text-rose-700 bg-rose-50', title: 'Absență nemotivată' },
  excused: { char: 'M', className: 'text-amber-700 bg-amber-50', title: 'Absență motivată' },
  late: { char: 'Î', className: 'text-blue-700 bg-blue-50', title: 'Întârziere' },
  present: { char: '✓', className: 'text-emerald-700 bg-emerald-50', title: 'Prezent / Finalizată' },
};

/** The symbol(s) a lesson shows: exactly one — "I" alone when replaced, never "✓/I" or "M/I". */
export function symbolsForLesson(l: MarkLesson): Sym[] {
  const outcome = outcomeOf(l);
  if (outcome === 'replaced') {
    return [{ char: 'I', className: 'text-violet-700 bg-violet-50', title: `Înlocuire${l.replacement_teacher_name ? ` — ${l.replacement_teacher_name}` : ''}` }];
  }
  if (outcome) return [SYMBOLS[outcome]];
  return [{ char: '•', className: 'text-slate-300', title: `Programată · ${(l.time ?? '').slice(0, 5)} · ${l.discipline ?? 'fără disciplină'} — click pentru a marca` }];
}

/** Which mark button is active for a lesson (a replaced lesson has none — only "I" is). */
export function markForLesson(l: MarkLesson): Mark | null {
  switch (outcomeOf(l)) {
    case 'recovered': return 'recovered';
    case 'unexcused': return 'unexcused_absence';
    case 'excused': return 'excused_absence';
    case 'present': return 'present';
    default: return null;
  }
}

/** What a register button does to a lesson. */
export type MarkAction = Mark | 'clear_replacement';

export interface LessonState {
  status: string;
  attendance_status: string | null;
  replacement_teacher_id: number | null;
}

/**
 * The lesson's stored state after pressing a register button — the single
 * definition used by both the server (what gets saved) and the browser (what is
 * shown instantly), so the two can never disagree. Each button makes ITS letter
 * the lesson's outcome, and:
 *   - an UNexcused absence (N) counts as a finished lesson (the student pays for it);
 *   - an EXcused absence (M) is NOT finished — it is carried to next month as a
 *     price credit (see lib/credits.ts), never as an extra lesson;
 *   - a replaced lesson is done automatically (only "I" shows);
 *   - a letter replaces an earlier "I".
 */
export function nextState(cur: LessonState, action: MarkAction, replacementTeacherId?: number | null): LessonState {
  switch (action) {
    case 'present':           return { status: 'completed', attendance_status: 'present', replacement_teacher_id: null };
    case 'excused_absence':   return { status: 'scheduled', attendance_status: 'excused_absence', replacement_teacher_id: null };
    case 'unexcused_absence': return { status: 'completed', attendance_status: 'unexcused_absence', replacement_teacher_id: null };
    case 'recovered':         return { status: 'recovered', attendance_status: 'present', replacement_teacher_id: null };
    case 'cancelled':         return { status: 'cancelled', attendance_status: cur.attendance_status, replacement_teacher_id: null };
    case 'replacement':       return { status: 'completed', attendance_status: 'present', replacement_teacher_id: replacementTeacherId ?? null };
    case 'clear_replacement': return { ...cur, replacement_teacher_id: null };
  }
}
