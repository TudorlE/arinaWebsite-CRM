import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthNavProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  className?: string;
}

/**
 * ‹ Octombrie 2026 › — two equal square arrows around a centred label, so the
 * control is symmetric at any width (full row on phone, fixed width on desktop).
 */
export default function MonthNav({ label, onPrev, onNext, nextDisabled, className = '' }: MonthNavProps) {
  const arrow = 'h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-[background-color,transform] active:scale-95 disabled:opacity-30 disabled:active:scale-100';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button type="button" onClick={onPrev} aria-label="Luna anterioară" className={arrow}>
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="flex-1 text-center text-sm font-bold text-slate-700 dark:text-slate-300 capitalize truncate">{label}</span>
      <button type="button" onClick={onNext} disabled={nextDisabled} aria-label="Luna următoare" className={arrow}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
