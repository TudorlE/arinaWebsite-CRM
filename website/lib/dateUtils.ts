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
