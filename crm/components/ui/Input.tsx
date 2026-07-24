import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  shake?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, shake, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={`w-full px-3 py-2 text-sm rounded-lg border
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-slate-100
            border-slate-300 dark:border-slate-700
            placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error || shake ? 'border-red-500' : ''}
            ${shake ? 'animate-field-error' : ''}
            ${className}`}
        />
        {(error || shake) && (
          <p className="text-xs text-red-500 animate-fade-in">{error ?? 'Câmp obligatoriu'}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
