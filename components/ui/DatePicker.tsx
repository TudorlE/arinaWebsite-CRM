'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string; // 'YYYY-MM-DD'
  onChange: (value: string) => void;
  shake?: boolean;
  placeholder?: string;
  /** Latest selectable year — defaults to the current year (useful for birth dates). */
  maxYear?: number;
  minYear?: number;
}

const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];
const DAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function pad2(n: number) { return String(n).padStart(2, '0'); }

function parse(value: string): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function DatePicker({ label, value, onChange, shake, placeholder, maxYear, minYear = 1930 }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parse(value);
  const today = new Date();
  const topYear = maxYear ?? today.getFullYear();
  const [viewYear, setViewYear]   = useState(parsed?.y ?? topYear - 15);
  const [viewMonth, setViewMonth] = useState(parsed?.m ?? today.getMonth());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open && parsed) { setViewYear(parsed.y); setViewMonth(parsed.m); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayValue = parsed
    ? `${parsed.d} ${MONTHS_RO[parsed.m]} ${parsed.y}`
    : '';

  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday-first
  const totalDays = daysInMonth(viewYear, viewMonth);
  const prevMonthDays = daysInMonth(viewMonth === 0 ? viewYear - 1 : viewYear, viewMonth === 0 ? 11 : viewMonth - 1);

  const cells: { day: number; inMonth: boolean; y: number; m: number }[] = [];
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, inMonth: false, y: viewMonth === 0 ? viewYear - 1 : viewYear, m: viewMonth === 0 ? 11 : viewMonth - 1 });
  for (let d = 1; d <= totalDays; d++) cells.push({ day: d, inMonth: true, y: viewYear, m: viewMonth });
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1];
    const nm = last.m === 11 ? 0 : last.m + 1;
    const ny = last.m === 11 ? last.y + 1 : last.y;
    cells.push({ day: cells.length - (firstDow + totalDays) + 1, inMonth: false, y: ny, m: nm });
    if (cells.length >= 42) break;
  }

  const selectDay = (y: number, m: number, d: number) => {
    onChange(`${y}-${pad2(m + 1)}-${pad2(d)}`);
    setOpen(false);
  };

  const years = Array.from({ length: topYear - minYear + 1 }, (_, i) => topYear - i);

  return (
    <div className="flex flex-col gap-1 relative" ref={rootRef}>
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border text-left
          bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
          border-slate-300 dark:border-slate-700
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          transition-all duration-150
          ${shake ? 'border-red-500 animate-field-error' : ''}`}
      >
        <CalendarDays className="w-4 h-4 text-brand-500 flex-shrink-0" />
        <span className={displayValue ? '' : 'text-slate-400 dark:text-slate-500'}>
          {displayValue || placeholder || 'Selectează data'}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 animate-modal-pop overflow-hidden">
          {/* Header: gradient + month/year quick pickers */}
          <div className="bg-gradient-to-br from-brand-600 via-brand-600 to-accent-600 px-4 py-3 flex items-center gap-2">
            <button type="button" onClick={() => setViewMonth(m => { if (m === 0) { setViewYear(y => y - 1); return 11; } return m - 1; })} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={viewMonth}
              onChange={e => setViewMonth(Number(e.target.value))}
              className="flex-1 bg-white/15 hover:bg-white/25 text-white text-sm font-bold rounded-lg px-2 py-1 focus:outline-none appearance-none text-center cursor-pointer transition-colors [&>option]:text-slate-900"
            >
              {MONTHS_RO.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select
              value={viewYear}
              onChange={e => setViewYear(Number(e.target.value))}
              className="bg-white/15 hover:bg-white/25 text-white text-sm font-bold rounded-lg px-2 py-1 focus:outline-none appearance-none text-center cursor-pointer transition-colors [&>option]:text-slate-900"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" onClick={() => setViewMonth(m => { if (m === 11) { setViewYear(y => y + 1); return 0; } return m + 1; })} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day grid */}
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {DAY_HEADERS.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((c, i) => {
                const isSelected = parsed && parsed.y === c.y && parsed.m === c.m && parsed.d === c.day;
                const isToday = c.y === today.getFullYear() && c.m === today.getMonth() && c.day === today.getDate();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDay(c.y, c.m, c.day)}
                    className={`h-8 rounded-lg text-xs font-semibold transition-all duration-150
                      ${!c.inMonth ? 'text-slate-300 dark:text-slate-700' : 'text-slate-700 dark:text-slate-200'}
                      ${isSelected ? 'bg-brand-600 text-white shadow-md scale-105' : 'hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:scale-105'}
                      ${isToday && !isSelected ? 'ring-1 ring-brand-400 ring-inset' : ''}`}
                  >
                    {c.day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
