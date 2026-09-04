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
