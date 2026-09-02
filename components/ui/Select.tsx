import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  shake?: boolean;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, shake, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          {...props}
          className={`w-full px-3 py-2 text-sm rounded-lg border
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-slate-100
            border-slate-300 dark:border-slate-700
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error || shake ? 'border-red-500' : ''}
            ${shake ? 'animate-field-error' : ''}
            ${className}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {(error || shake) && (
          <p className="text-xs text-red-500 animate-fade-in">{error ?? 'Câmp obligatoriu'}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
export default Select;
