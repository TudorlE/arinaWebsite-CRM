'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Cake, PartyPopper, GraduationCap, Music } from 'lucide-react';
import { upcomingBirthdays, UpcomingBirthday } from '@/lib/dateUtils';
import type { Student, Teacher } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

/** How many of the closest upcoming birthdays to show — not a day window, so
 *  the card always has something as long as anyone has a birth_date saved,
 *  even if their birthday is months away. */
const SHOWN_COUNT = 5;

function useBirthdays() {
  const { data: studentsData } = useSWR<{ students: Student[] }>('/api/students', fetcher);
  const { data: teachersData } = useSWR<{ teachers: Teacher[] }>('/api/teachers', fetcher);
  const people = [
    ...(studentsData?.students ?? [])
      .filter(s => s.status !== 'inactive')
      .map(s => ({ id: s.id, name: s.name, birth_date: s.birth_date, kind: 'student' as const })),
    ...(teachersData?.teachers ?? [])
      .map(t => ({ id: t.id, name: t.name, birth_date: t.birth_date, kind: 'teacher' as const })),
  ];
  return upcomingBirthdays(people, SHOWN_COUNT);
}

const kindLabel = (b: UpcomingBirthday) => (b.kind === 'teacher' ? 'Profesor' : 'Elev');

function whenLabel(days: number) {
  if (days === 0) return 'Azi';
  if (days === 1) return 'Mâine';
  return `în ${days} zile`;
}

/** Prominent banner shown only when someone has their birthday today. */
export function BirthdayTodayBanner() {
  const router = useRouter();
  const today = useBirthdays().filter(b => b.daysUntil === 0);
  if (today.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 sm:p-6 text-white shadow-lg"
      style={{ background: 'linear-gradient(135deg, #db2777 0%, #9333ea 55%, #c9a020 120%)' }}
    >
      <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', filter: 'blur(30px)', pointerEvents: 'none' }} />
      <div className="relative flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 animate-bounce">
          <PartyPopper className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">Zi de naștere azi 🎉</p>
          <div className="mt-1 flex flex-col gap-1">
            {today.map(b => (
              <button
                key={`${b.kind}-${b.id}`}
                onClick={() => b.kind === 'student' && router.push(`/admin/students/${b.id}`)}
                className={`text-left text-lg sm:text-xl font-extrabold leading-tight ${b.kind === 'student' ? 'hover:underline' : 'cursor-default'}`}
              >
                La mulți ani, {b.name}!{' '}
                <span className="text-sm font-semibold text-white/85">
                  ({kindLabel(b)} · împlinește {b.turning} ani)
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** List of the closest upcoming birthdays, whatever their actual distance. */
export function UpcomingBirthdaysCard() {
  const router = useRouter();
  const list = useBirthdays();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50">
        <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center">
          <Cake className="w-4 h-4 text-pink-500" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Zile de naștere</h2>
          <p className="text-xs text-slate-400">Cele mai apropiate · {list.length}</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
        {list.length > 0 ? list.map(b => {
          const isToday = b.daysUntil === 0;
          const soon = b.daysUntil <= 7;
          const Icon = b.kind === 'teacher' ? GraduationCap : Music;
          return (
            <div
              key={`${b.kind}-${b.id}`}
              onClick={() => b.kind === 'student' && router.push(`/admin/students/${b.id}`)}
              className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                b.kind === 'student' ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''
              } ${isToday ? 'bg-pink-50 dark:bg-pink-950/30' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                isToday ? 'bg-pink-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                <span className="text-sm font-extrabold leading-none">{b.date.getDate()}</span>
                <span className="text-[9px] uppercase font-bold leading-none mt-0.5">
                  {b.date.toLocaleDateString('ro-RO', { month: 'short' }).replace('.', '')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{b.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Icon className="w-3 h-3" /> {kindLabel(b)} · împlinește {b.turning} ani
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${
                isToday ? 'bg-pink-500 text-white'
                  : soon ? 'bg-amber-400 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {isToday ? '🎂 Azi' : whenLabel(b.daysUntil)}
              </span>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Cake className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400 text-center px-6">
              Nicio zi de naștere salvată încă
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
