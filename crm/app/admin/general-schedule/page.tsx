'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, CalendarRange, Plus, Pencil, Trash2, GripVertical, Filter, X } from 'lucide-react';
import LessonOccurrenceForm from '@/components/general-schedule/LessonOccurrenceForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Lesson, INSTRUMENTS } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 – 22:00
const SHORT_DAYS = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];

function getWeekDates(ref: Date): Date[] {
  const day = ref.getDay();
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - day + 1);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
}
function getMonthDates(ref: Date): Date[] {
  const year = ref.getFullYear(), month = ref.getMonth();
  const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0);
  const startDay = new Date(firstDay); const dow = firstDay.getDay();
  startDay.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));
  const endDay = new Date(lastDay); const dowEnd = lastDay.getDay();
  endDay.setDate(lastDay.getDate() + (dowEnd === 0 ? 0 : 7 - dowEnd));
  const days: Date[] = []; const cur = new Date(startDay);
  while (cur <= endDay) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return days;
}
function fmtDate(d: Date) { return d.toISOString().split('T')[0]; }
function pad2(n: number) { return String(n).padStart(2, '0'); }

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-brand-500/90 border-brand-400 text-white',
  completed: 'bg-emerald-500/90 border-emerald-400 text-white',
  cancelled: 'bg-slate-400/60 border-slate-300 text-white line-through',
  recovered: 'bg-accent-500/90 border-accent-400 text-white',
};

const STATUS_FILTER_OPTIONS = [
  { value: 'scheduled', label: 'Programate' },
  { value: 'completed', label: 'Finalizate' },
  { value: 'cancelled', label: 'Anulate' },
  { value: 'recovered', label: 'Recuperări' },
];

type DeleteMode = 'occurrence' | 'future' | 'all';
const DELETE_OPTIONS: { value: DeleteMode; label: string; hint: string }[] = [
  { value: 'occurrence', label: 'Doar această apariție', hint: 'Șterge o singură lecție' },
  { value: 'future',     label: 'Toate aparițiile viitoare', hint: 'De la această dată încolo' },
  { value: 'all',        label: 'Întregul orar recurent', hint: 'Dezactivează orarul fix și șterge lecțiile viitoare' },
];

export default function GeneralSchedulePage() {
  const [me, setMe] = useState<{ role: string | null; teacher_id: number | null } | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe({ role: d.user?.role ?? null, teacher_id: d.user?.teacher_id ?? null })).catch(() => {});
  }, []);

  const { toasts, toast, remove } = useToast();
  const { data: teachersData } = useSWR('/api/teachers', fetcher);
  const { data: studentsData } = useSWR('/api/students', fetcher);
  const { data: cabinetsData } = useSWR('/api/cabinets', fetcher);
  const { data: allData, mutate } = useSWR('/api/lessons', fetcher);
  const allLessons: Lesson[] = allData?.lessons ?? [];

  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [reference, setReference] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [addDate, setAddDate] = useState('');
  const [addTime, setAddTime] = useState('09:00');
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('occurrence');
  const [deleting, setDeleting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropCell, setDropCell] = useState<string | null>(null);

  const [fTeacher, setFTeacher] = useState('');
  const [fStudent, setFStudent] = useState('');
  const [fDiscipline, setFDiscipline] = useState('');
  const [fCabinet, setFCabinet] = useState('');
  const [fStatus, setFStatus] = useState('');

  const isTeacher = me?.role === 'teacher';
  const isStudent = me?.role === 'student';
  const canEdit = me?.role === 'admin' || me?.role === 'teacher';

  const weekDates = getWeekDates(reference);
  const monthDates = getMonthDates(reference);
  const dayStr = fmtDate(reference);

  const lessons = allLessons
    .filter(l => !isTeacher || !me?.teacher_id || l.teacher_id === me.teacher_id)
    .filter(l => !fTeacher || String(l.teacher_id) === fTeacher)
    .filter(l => !fStudent || String(l.student_id) === fStudent)
    .filter(l => !fDiscipline || l.discipline === fDiscipline)
    .filter(l => !fCabinet || String(l.cabinet_id ?? '') === fCabinet)
    .filter(l => !fStatus || l.status === fStatus);

  const rangeFrom = view === 'week' ? fmtDate(weekDates[0]) : view === 'month' ? fmtDate(monthDates[0]) : dayStr;
  const rangeTo   = view === 'week' ? fmtDate(weekDates[6]) : view === 'month' ? fmtDate(monthDates[monthDates.length - 1]) : dayStr;
  const visibleLessons = lessons.filter(l => l.date >= rangeFrom && l.date <= rangeTo);

  const navigate = (dir: 'prev' | 'next') => {
    const d = new Date(reference);
    if (view === 'day') d.setDate(d.getDate() + (dir === 'prev' ? -1 : 1));
    else if (view === 'week') d.setDate(d.getDate() + (dir === 'prev' ? -7 : 7));
    else d.setMonth(d.getMonth() + (dir === 'prev' ? -1 : 1));
    setReference(d);
  };

  const openAddLesson = (date: string, hour: number) => {
    setAddDate(date); setAddTime(`${pad2(hour)}:00`); setShowForm(true);
  };

  const handleDrop = async (date: string, hour: number) => {
    const id = draggingId;
    setDraggingId(null); setDropCell(null);
    if (!id) return;
    const lesson = allLessons.find(l => l.id === id);
    if (!lesson) return;
    const newTime = `${pad2(hour)}:00`;
    if (lesson.date === date && lesson.time?.slice(0, 5) === newTime) return;
    mutate({ lessons: allLessons.map(l => l.id === id ? { ...l, date, time: newTime } : l) }, false);
    const res = await fetch(`/api/lessons/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time: newTime, propagate: 'only' }),
    });
    if (!res.ok) { toast('Eroare la mutare', 'error'); mutate(); } else { toast('Lecție mutată', 'success'); mutate(); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/lessons/${deleteTarget.id}?mode=${deleteMode}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast(deleteMode === 'occurrence' ? 'Lecție ștearsă' : `Șterse: ${data.deleted ?? 1}${data.skipped ? `, păstrate: ${data.skipped}` : ''}`, 'success');
        mutate();
      } else {
        toast(data.error ?? 'Eroare la ștergere', 'error');
      }
    } finally {
      setDeleting(false); setDeleteTarget(null);
    }
  };

  const teachers = teachersData?.teachers ?? [];
  const students = studentsData?.students ?? [];
  const cabinets = cabinetsData?.cabinets ?? [];

  const rawLabel = view === 'month'
    ? reference.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
    : view === 'day'
      ? reference.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })
      : `${weekDates[0].toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })} – ${weekDates[6].toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}`;
  const navLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
  const todayStr = fmtDate(new Date());

  const renderLessonChip = (l: Lesson) => {
    const isMenu = activeMenu === l.id;
    return (
      <div key={l.id} className="relative">
        <button
          draggable={canEdit}
          onDragStart={canEdit ? e => { setDraggingId(l.id); setActiveMenu(null); e.dataTransfer.effectAllowed = 'move'; } : undefined}
          onDragEnd={canEdit ? () => { setDraggingId(null); setDropCell(null); } : undefined}
          onClick={e => { e.stopPropagation(); if (canEdit) setActiveMenu(isMenu ? null : l.id); }}
          className={`w-full text-left text-xs px-2 py-1.5 rounded-lg border select-none ${canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
            transition-all duration-150 ${STATUS_COLOR[l.status] ?? STATUS_COLOR.scheduled}
            ${draggingId === l.id ? 'opacity-40 scale-95' : 'hover:scale-[1.02]'}
            ${isMenu ? 'ring-2 ring-white/80 shadow-xl' : ''}`}
        >
          <div className="flex items-start gap-1">
            {canEdit && <GripVertical className="w-3 h-3 mt-0.5 opacity-50 flex-shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{l.student_name}</p>
              <p className="opacity-75 truncate text-[10px] mt-0.5">
                {l.time?.slice(0, 5)} · {l.duration}min{l.discipline ? ` · ${l.discipline}` : ''}{l.cabinet_name ? ` · ${l.cabinet_name}` : ''}
              </p>
            </div>
          </div>
        </button>
        {canEdit && isMenu && (
          <div onClick={e => e.stopPropagation()} className="absolute z-30 left-0 top-full mt-0.5 flex items-center gap-1 px-1.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <button onClick={() => { setEditLesson(l); setActiveMenu(null); }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/40">
              <Pencil className="w-3 h-3" /> Editează
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <button onClick={() => { setDeleteTarget(l); setDeleteMode('occurrence'); setActiveMenu(null); }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40">
              <Trash2 className="w-3 h-3" /> Șterge
            </button>
          </div>
        )}
      </div>
    );
  };

  const dayColumns = view === 'day' ? [reference] : view === 'week' ? weekDates : [];

  return (
    <div className="flex flex-col flex-1" onClick={() => activeMenu !== null && setActiveMenu(null)}>
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-600 to-accent-600 px-8 py-6 shadow-lg">
        <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><CalendarRange className="w-7 h-7 text-white" /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Program General</h1>
            <p className="text-brand-200 text-sm font-medium mt-0.5">{visibleLessons.length} lecții {view === 'day' ? 'azi' : view === 'week' ? 'săptămâna asta' : 'luna asta'}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => navigate('prev')} className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white min-w-56 text-center">{navLabel}</span>
          <button onClick={() => navigate('next')} className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
          <button onClick={() => setReference(new Date())} className="px-4 py-2 text-sm font-bold rounded-xl bg-brand-600 text-white shadow-md hover:bg-brand-500">Azi</button>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            {(['day', 'week', 'month'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-sm font-semibold ${view === v ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {v === 'day' ? 'Zilnic' : v === 'week' ? 'Săptămânal' : 'Lunar'}
              </button>
            ))}
          </div>
          {canEdit && (
            <Button size="sm" onClick={() => openAddLesson(view === 'day' ? dayStr : todayStr, 9)}>
              <Plus className="w-4 h-4" /> Lecție nouă
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Filtre</span>
          </div>
          <div className="w-36"><Select value={fTeacher} onChange={e => setFTeacher(e.target.value)} placeholder="Profesor" options={teachers.map((t: { id: number; name: string }) => ({ value: t.id, label: t.name }))} /></div>
          <div className="w-36"><Select value={fStudent} onChange={e => setFStudent(e.target.value)} placeholder="Elev" options={students.map((s: { id: number; name: string }) => ({ value: s.id, label: s.name }))} /></div>
          <div className="w-40"><Select value={fDiscipline} onChange={e => setFDiscipline(e.target.value)} placeholder="Disciplină" options={INSTRUMENTS.map(i => ({ value: i, label: i }))} /></div>
          <div className="w-36"><Select value={fCabinet} onChange={e => setFCabinet(e.target.value)} placeholder="Cabinet" options={cabinets.map((c: { id: number; name: string }) => ({ value: c.id, label: c.name }))} /></div>
          <div className="w-40"><Select value={fStatus} onChange={e => setFStatus(e.target.value)} placeholder="Status (toate)" options={STATUS_FILTER_OPTIONS} /></div>
          {(fTeacher || fStudent || fDiscipline || fCabinet || fStatus) && (
            <button onClick={() => { setFTeacher(''); setFStudent(''); setFDiscipline(''); setFCabinet(''); setFStatus(''); }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" /> Resetează
            </button>
          )}
        </div>

        {/* Grid */}
        {view === 'month' ? (
          <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="grid grid-cols-7 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
              {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">{d}</div>
              ))}
            </div>
            {Array.from({ length: monthDates.length / 7 }, (_, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                {monthDates.slice(wi * 7, wi * 7 + 7).map((d, di) => {
                  const dateStr = fmtDate(d);
                  const isToday = dateStr === todayStr;
                  const inMonth = d.getMonth() === reference.getMonth();
                  const dayLessons = lessons.filter(l => l.date === dateStr);
                  return (
                    <div key={di} onClick={() => canEdit && openAddLesson(dateStr, 9)}
                      className={`relative min-h-[100px] p-2 border-r border-slate-100 dark:border-slate-800 last:border-r-0 flex flex-col gap-1
                        ${isToday ? 'bg-brand-50/60 dark:bg-brand-900/15' : ''} ${!inMonth ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''}
                        ${canEdit ? 'cursor-pointer hover:bg-brand-50/40 dark:hover:bg-brand-900/10' : ''}`}>
                      <span className={`self-start text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-600 text-white' : inMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300'}`}>{d.getDate()}</span>
                      <div className="flex flex-col gap-0.5 overflow-visible">
                        {dayLessons.slice(0, 3).map(l => renderLessonChip(l))}
                        {dayLessons.length > 3 && <span className="text-[10px] text-slate-400 px-1">+{dayLessons.length - 3} mai multe</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="min-w-[420px]" style={{ minWidth: view === 'week' ? 820 : 420 }}>
              <div className="grid border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10" style={{ gridTemplateColumns: `72px repeat(${dayColumns.length}, 1fr)` }}>
                <div className="py-4" />
                {dayColumns.map((d, i) => {
                  const isToday = fmtDate(d) === todayStr;
                  return (
                    <div key={i} className={`py-4 text-center border-l border-slate-200 dark:border-slate-700 ${isToday ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-brand-500' : 'text-slate-400'}`}>{SHORT_DAYS[d.getDay()]}</p>
                      <div className={`mt-1.5 mx-auto w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-brand-600 text-white' : 'text-slate-700 dark:text-slate-200'}`}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              {HOURS.map(hour => (
                <div key={hour} className="grid border-b border-slate-100 dark:border-slate-800" style={{ gridTemplateColumns: `72px repeat(${dayColumns.length}, 1fr)`, minHeight: '76px' }}>
                  <div className="py-3 px-3 text-xs font-mono text-slate-400 text-right border-r border-slate-100 dark:border-slate-800 select-none">{pad2(hour)}:00</div>
                  {dayColumns.map((d, di) => {
                    const dateStr = fmtDate(d);
                    const cellLessons = lessons.filter(l => l.date === dateStr && parseInt(l.time?.split(':')[0] ?? '9') === hour);
                    const isToday = dateStr === todayStr;
                    const cellKey = `${dateStr}|${hour}`;
                    const isDropTarget = dropCell === cellKey && draggingId !== null;
                    return (
                      <div key={di}
                        onDragOver={e => { if (!canEdit || draggingId === null) return; e.preventDefault(); if (dropCell !== cellKey) setDropCell(cellKey); }}
                        onDragLeave={() => { if (dropCell === cellKey) setDropCell(null); }}
                        onDrop={e => { if (!canEdit) return; e.preventDefault(); handleDrop(dateStr, hour); }}
                        className={`group relative border-l border-slate-100 dark:border-slate-800 p-1.5 flex flex-col gap-1 transition-all
                          ${isToday ? 'bg-brand-50/40 dark:bg-brand-900/10' : ''}
                          ${isDropTarget ? 'bg-brand-100 dark:bg-brand-900/40 ring-2 ring-brand-400 ring-inset' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                        {cellLessons.map(renderLessonChip)}
                        {canEdit && (
                          <button onClick={() => openAddLesson(dateStr, hour)}
                            className="absolute inset-x-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg pointer-events-none group-hover:pointer-events-auto z-40">
                            <Plus className="w-3.5 h-3.5" /> Adaugă
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pb-1">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-brand-500" />Programat</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500" />Finalizat</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-slate-400" />Anulat</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-accent-500" />Recuperat</span>
          {isStudent && <span className="ml-auto text-[11px] opacity-50 italic">Mod vizualizare</span>}
        </div>
      </main>

      <LessonOccurrenceForm open={showForm} onClose={() => setShowForm(false)} onSaved={() => mutate()} defaultDate={addDate} defaultTime={addTime} showToast={toast} />
      <LessonOccurrenceForm open={!!editLesson} onClose={() => setEditLesson(null)} onSaved={() => mutate()} lesson={editLesson} showToast={toast} />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Șterge lecția" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Lecție cu <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.student_name}</strong>
          {deleteTarget && <> din {deleteTarget.date} la {deleteTarget.time?.slice(0, 5)}</>}.
        </p>
        {deleteTarget?.recurring_schedule_id ? (
          <div className="space-y-2 mb-4">
            {DELETE_OPTIONS.map(opt => (
              <label key={opt.value} className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${deleteMode === opt.value ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                <input type="radio" name="deleteMode" checked={deleteMode === opt.value} onChange={() => setDeleteMode(opt.value)} className="accent-red-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{opt.label}</p>
                  <p className="text-xs text-slate-400">{opt.hint}</p>
                </div>
              </label>
            ))}
          </div>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Anulează</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Se șterge…' : 'Șterge'}</Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
