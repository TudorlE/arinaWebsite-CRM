type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray' | 'indigo';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  gray:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export default function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

/** Helper: returns the Badge variant for a payment status */
export function paymentBadge(status: string): BadgeVariant {
  if (status === 'paid')    return 'green';
  if (status === 'partial') return 'yellow';
  return 'yellow'; // unpaid
}

/** Localized label for a payment status */
export function paymentLabel(status: string): string {
  switch (status) {
    case 'paid':    return 'Plătit';
    case 'partial': return 'Parțial';
    default:        return 'Neplătit';
  }
}

/** Helper: returns the Badge variant for a lesson status */
export function lessonBadge(status: string): BadgeVariant {
  return status === 'completed' ? 'green' : status === 'cancelled' ? 'red' : 'blue';
}

/** Helper: returns the Badge variant for a level */
export function levelBadge(level: string): BadgeVariant {
  return level === 'advanced' ? 'purple' : level === 'intermediate' ? 'indigo' : 'gray';
}
