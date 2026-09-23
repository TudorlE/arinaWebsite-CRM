/**
 * Who appears in the register for a given discipline / teacher. Pure and shared
 * so the rule is testable: the roster comes from what each student is
 * ACTUALLY enrolled in (their per-instrument subscriptions and its teacher),
 * never from the legacy "primary teacher" of the student once subscriptions
 * exist, and paused/inactive students never show.
 */
export interface RosterSubscription { instrument: string; teacher_id?: number | null; status?: string | null }

export interface RosterStudent {
  status?: string | null;
  teacher_id?: number | null;
  instruments?: string[] | null;
  subscriptions?: RosterSubscription[] | null;
}

const isActive = (v?: string | null) => (v ?? 'active') === 'active';

/** Active enrollments as instrument→teacher. Old students with no subscriptions fall back to instruments + primary teacher. */
export function enrollments(s: RosterStudent): { instrument: string; teacherId: number | null }[] {
  const subs = s.subscriptions ?? [];
  if (subs.length > 0) {
    return subs.filter(x => isActive(x.status)).map(x => ({ instrument: x.instrument, teacherId: x.teacher_id ?? null }));
  }
  return (s.instruments ?? []).map(i => ({ instrument: i, teacherId: s.teacher_id ?? null }));
}

/** Should this student be a row in the register for the given filters? */
export function inRegister(s: RosterStudent, discipline: string, teacherId: number | null): boolean {
  if (!isActive(s.status)) return false;
  const active = enrollments(s);
  if (active.length === 0) return false;
  const relevant = discipline ? active.filter(e => e.instrument === discipline) : active;
  if (relevant.length === 0) return false;
  if (!teacherId) return true;
  return relevant.some(e => e.teacherId === teacherId);
}

/**
 * Which instrument a NEW lesson from the register is for. With a teacher chosen
 * it must be the instrument THAT teacher teaches this student (not simply the
 * student's first instrument, which may belong to someone else and would make
 * the lesson vanish from the chosen teacher's view). `extra` = another lesson
 * the same day: prefer an instrument that has none yet.
 */
export function pickInstrument(
  s: RosterStudent,
  opts: { discipline?: string; teacherId?: number | null; taken?: (string | null)[]; extra?: boolean },
): string | null {
  let cands = enrollments(s);
  if (opts.discipline) cands = cands.filter(e => e.instrument === opts.discipline);
  if (opts.teacherId) {
    const mine = cands.filter(e => e.teacherId === opts.teacherId);
    if (mine.length > 0) cands = mine;
  }
  const names = cands.map(e => e.instrument);
  if (opts.extra) return names.find(i => !(opts.taken ?? []).includes(i)) ?? names[0] ?? null;
  return names[0] ?? null;
}
