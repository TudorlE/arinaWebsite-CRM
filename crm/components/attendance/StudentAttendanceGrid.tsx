'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ATTENDANCE_STATUSES, AttendanceStatus } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Record_ {
  lesson_id: number;
  date: string;
  time: string;
  discipline: string | null;
  teacher_name?: string | null;
  status: AttendanceStatus | null;
  notes: string | null;
}

const STATUS_DOT: Record<AttendanceStatus, string> = {
  present:           'bg-emerald-500',
  excused_absence:   'bg-amber-400',
  unexcused_absence: 'bg-red-500',
  late:              'bg-blue-400',
};

function pad2(n: number) { return String(n).padStart(2, '0'); }

export default function StudentAttendanceGrid({ studentId }: { studentId: number }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  const ref = new Date();
  ref.setDate(1);
  ref.setMonth(ref.getMonth() + monthOffset);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const from = `${year}-${pad2(month + 1)}-01`;
  const to = `${year}-${pad2(month + 1)}-${pad2(daysInMonth)}`;

  const { data, mutate } = useSWR(
    `/api/attendance?student_id=${studentId}&date_from=${from}&date_to=${to}&limit=200`,
    fetcher,
  );
  const records: Record_[] = data?.records ?? [];

  const byDate = records.reduce<Record<string, Record_[]>>((acc, r) => {
    (acc[r.date] ??= []).push(r);
    return acc;
  }, {});

  const monthLabel = ref.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

  const mark = async (lessonId: number, status: AttendanceStatus) => {
    setSaving(lessonId);
    try {
      await fetch('/api/attendance', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, status }),
      });
      mutate();
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonthOffset(m => m - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{monthLabel}</p>
        <button onClick={() => setMonthOffset(m => Math.min(m + 1, 0))} disabled={monthOffset >= 0} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30">
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dateStr = `${year}-${pad2(month + 1)}-${pad2(day)}`;
          const dayRecords = byDate[dateStr] ?? [];
          const hasLesson = dayRecords.length > 0;
          const primaryStatus = dayRecords.find(r => r.status)?.status ?? null;
          const isOpen = openDate === dateStr;
          return (
            <div key={day} className="relative">
              <button
                onClick={() => hasLesson && setOpenDate(isOpen ? null : dateStr)}
                disabled={!hasLesson}
                title={hasLesson ? dayRecords.map(r => `${r.time?.slice(0, 5)} ${r.discipline ?? ''}`).join(', ') : undefined}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all
                  ${hasLesson ? (primaryStatus ? `${STATUS_DOT[primaryStatus]} text-white shadow-sm hover:scale-110 cursor-pointer` : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:scale-110 cursor-pointer') : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700'}
                  ${isOpen ? 'ring-2 ring-brand-400 scale-110' : ''}`}
              >
                {day}
              </button>
              {isOpen && (
                <div onClick={e => e.stopPropagation()} className="absolute z-30 top-full mt-1 left-1/2 -translate-x-1/2 w-56 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-2">
                  {dayRecords.map(r => (
                    <div key={r.lesson_id}>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        {r.time?.slice(0, 5)} {r.discipline ? `· ${r.discipline}` : ''}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {ATTENDANCE_STATUSES.map(s => (
                          <button
                            key={s.value}
                            onClick={() => mark(r.lesson_id, s.value)}
                            disabled={saving === r.lesson_id}
                            className={`text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all ${r.status === s.value ? `${STATUS_DOT[s.value]} text-white` : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                          >
                            {s.short} · {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-slate-500 dark:text-slate-400">
        {ATTENDANCE_STATUSES.map(s => (
          <span key={s.value} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s.value]}`} />
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
          Lecție neconsemnată
        </span>
      </div>
    </div>
  );
}
