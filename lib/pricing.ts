/**
 * Prețuri "Arry Production Studio" (MDL).
 * Sursă: tabelul de prețuri furnizat de școală.
 *
 * `sub` = preț abonament lunar (în funcție de numărul de lecții / lună)
 * `perLesson` = preț per lecție individuală
 * Fiecare are varianta `old` (abonament vechi) și `new` (abonament nou).
 */

export type PlanType = 'old' | 'new';
export type LessonCount = 4 | 8 | 12;

export interface ServicePricing {
  label: string;
  sub: Record<LessonCount, { old: number; new: number }>;
  perLesson: { old: number; new: number };
  /** Preț fix lunar (ex. Solfegiu — lecție de grup). Dacă e setat, ignoră `sub`. */
  flatMonthly?: number;
}

/** Cheile corespund valorilor din `INSTRUMENTS` (lib/types.ts). */
export const PRICING: Record<string, ServicePricing> = {
  'Canto': {
    label: 'Canto',
    sub: { 4: { old: 1500, new: 1800 }, 8: { old: 3000, new: 3600 }, 12: { old: 4500, new: 5400 } },
    perLesson: { old: 375, new: 450 },
  },
  'Chitară': {
    label: 'Chitară',
    sub: { 4: { old: 1500, new: 1800 }, 8: { old: 3000, new: 3600 }, 12: { old: 4500, new: 5400 } },
    perLesson: { old: 375, new: 450 },
  },
  'Tobe': {
    label: 'Tobe',
    sub: { 4: { old: 1500, new: 1800 }, 8: { old: 3000, new: 3600 }, 12: { old: 4500, new: 5400 } },
    perLesson: { old: 375, new: 450 },
  },
  'Piano': {
    label: 'Pian',
    sub: { 4: { old: 1000, new: 1500 }, 8: { old: 2000, new: 2500 }, 12: { old: 3000, new: 4000 } },
    perLesson: { old: 250, new: 300 },
  },
  'Solfegiu și teoria muzicii': {
    label: 'Solfegiu',
    sub: { 4: { old: 500, new: 500 }, 8: { old: 500, new: 500 }, 12: { old: 500, new: 500 } },
    perLesson: { old: 0, new: 0 },
    flatMonthly: 500, // lecție de grup, 4 lecții / lună
  },
};

export const SERVICE_KEYS = Object.keys(PRICING);
export const LESSON_COUNTS: LessonCount[] = [4, 8, 12];

/** Suma lunară pentru un serviciu / plan / număr de lecții. */
export function subscriptionAmount(service: string, plan: PlanType, lessons: LessonCount): number | null {
  const p = PRICING[service];
  if (!p) return null;
  if (p.flatMonthly != null) return p.flatMonthly;
  return p.sub[lessons]?.[plan] ?? null;
}

/** Prețul per lecție individuală pentru un serviciu / plan. */
export function perLessonPrice(service: string, plan: PlanType): number | null {
  const p = PRICING[service];
  if (!p) return null;
  return p.perLesson[plan] ?? null;
}

/** Text scurt pentru câmpul „note” al plății. */
export function planSummary(service: string, plan: PlanType, lessons: LessonCount): string {
  const p = PRICING[service];
  const name = p?.label ?? service;
  const planLabel = plan === 'old' ? 'abonament vechi' : 'abonament nou';
  const per = perLessonPrice(service, plan);
  if (p?.flatMonthly != null) return `${name} · lecție de grup · ${p.flatMonthly} lei/lună`;
  return `${name} · ${planLabel} · ${lessons} lecții · ${per} lei/lecție`;
}
