/** Generates 'HH:MM' slots from start to end (inclusive), stepping by stepMinutes. */
export function generateSlots(startHHMM: string, endHHMM: string, stepMinutes: number): string[] {
  const [sh, sm] = startHHMM.split(':').map(Number);
  const [eh, em] = endHHMM.split(':').map(Number);
  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  const slots: string[] = [];
  for (let t = startTotal; t <= endTotal; t += stepMinutes) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
}

/** Standard lesson slots: 45min apart, 13:15–20:45 inclusive. */
export const DEFAULT_TIME_SLOTS = generateSlots('13:15', '20:45', 45);

/** Weekend lesson slots: 45min apart, starting 09:00, last lesson ending by 18:00. */
export const WEEKEND_TIME_SLOTS = generateSlots('09:00', '17:15', 45);

/** Picks the right slot set for a DB day_of_week (0=Duminică..6=Sâmbătă). */
export function timeSlotsForDay(dayOfWeek: number): string[] {
  return dayOfWeek === 0 || dayOfWeek === 6 ? WEEKEND_TIME_SLOTS : DEFAULT_TIME_SLOTS;
}
