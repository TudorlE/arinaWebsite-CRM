import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** Icon-only button: a perfect square of the same height as a text button of that size. */
  icon?: boolean;
  children: ReactNode;
}

const variants = {
  primary:   'bg-brand-600 hover:bg-brand-700 text-white border-transparent',
  secondary: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  danger:    'bg-red-600 hover:bg-red-700 text-white border-transparent',
  ghost:     'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent',
};

// Fixed heights (not padding-driven) so every button of a size lines up
// exactly, whatever its content — text, icon + text or icon only.
const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
};
const iconSizes = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap font-medium rounded-lg border transition-[background-color,transform] active:scale-[0.97]
        ${variants[variant]} ${icon ? iconSizes[size] : sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}
        ${className}`}
    >
      {children}
    </button>
  );
}
