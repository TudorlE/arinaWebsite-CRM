/** Shared helpers for the birth-date fields on Student/Teacher. */

export function calculateAge(birthDate: string): number {
  const b = new Date(birthDate + 'T00:00:00');
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const hasHadBirthdayThisYear = now.getMonth() > b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() >= b.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

/** e.g. "15 martie 2014 (12 ani)" */
export function formatBirthDate(birthDate?: string | null): string {
  if (!birthDate) return 'Nespecificată';
  const d = new Date(birthDate + 'T00:00:00');
  const formatted = d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${formatted} (${calculateAge(birthDate)} ani)`;
}

export interface UpcomingBirthday {
  id: number;
  name: string;
  kind: 'student' | 'teacher';
  /** Days until the next birthday — 0 means today. */
  daysUntil: number;
  /** Age they turn on that birthday. */
  turning: number;
  /** The next birthday as a local Date (this year or next). */
  date: Date;
}

/**
 * The `limit` closest upcoming birthdays (today included), soonest first —
 * always returns something as long as at least one person has a birth_date,
 * regardless of how far off it is (no fixed day window to come up empty
 * against). 29 Feb birthdays fall on 28 Feb in non-leap years.
 */
export function upcomingBirthdays(
  people: { id: number; name: string; birth_date?: string | null; kind: 'student' | 'teacher' }[],
  limit = 5,
  today = new Date(),
): UpcomingBirthday[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const atYear = (y: number, m: number, d: number) => {
    const lastDay = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(d, lastDay));
  };
  const out: UpcomingBirthday[] = [];
  for (const p of people) {
    if (!p.birth_date) continue;
    const [by, bm, bd] = p.birth_date.slice(0, 10).split('-').map(Number);
    if (!by || !bm || !bd) continue;
    let next = atYear(start.getFullYear(), bm - 1, bd);
    if (next < start) next = atYear(start.getFullYear() + 1, bm - 1, bd);
    const daysUntil = Math.round((next.getTime() - start.getTime()) / 86400000);
    out.push({ id: p.id, name: p.name, kind: p.kind, daysUntil, turning: next.getFullYear() - by, date: next });
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name)).slice(0, limit);
}
