'use client';

import { use, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, Trash2, Plus, Calendar,
  Phone, Mail, Music2,
} from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/ui/Button';
import Badge, { paymentBadge, lessonBadge } from '@/components/ui/Badge';
import StudentForm from '@/components/students/StudentForm';
import LessonForm from '@/components/lessons/LessonForm';
import PaymentForm from '@/components/payments/PaymentForm';
import StudentAttendanceGrid from '@/components/attendance/StudentAttendanceGrid';
import StudentMonthlyStats from '@/components/students/StudentMonthlyStats';
import Modal from '@/components/ui/Modal';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Student, Lesson, Payment, StudentNote, MONTHS, STUDENT_STATUSES } from '@/lib/types';
import { formatBirthDate } from '@/lib/dateUtils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const LESSON_STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programată', completed: 'Finalizată', cancelled: 'Anulată', recovered: 'Recuperată',
};
const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: 'Plătit', unpaid: 'Neplătit', partial: 'Parțial', overdue: 'Restant',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const router  = useRouter();
  const { toasts, toast, remove } = useToast();

  const { data, mutate } = useSWR(`/api/students/${id}`, fetcher);
  // Data already warm (preloaded on tap) → the page slides in once, ready.
  // Otherwise the skeleton slides in and the content then just fades in over
  // it, instead of sliding a second time.
  const [warmOnArrival] = useState(() => data !== undefined);
  const { data: lessonsData, mutate: mutateLessons } = useSWR(`/api/lessons?student_id=${id}`, fetcher);
  const { data: paymentsData, mutate: mutatePayments } = useSWR(`/api/payments?student_id=${id}`, fetcher);

  const [showEdit, setShowEdit]       = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [showLesson, setShowLesson]   = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [noteText, setNoteText]       = useState('');
  const [deletingNote, setDeletingNote] = useState<number | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [savingNote, setSavingNote]   = useState(false);

  // Back returns to the page the admin came from (Elevi Frecvență, Elevi…),
  // keeping its scroll/filters; a direct link falls back to the student list.
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/admin/students');
  };

  const student: Student | undefined = data?.student;
  const notes: StudentNote[] = data?.notes ?? [];
  const lessons: Lesson[] = lessonsData?.lessons ?? [];
  const payments: Payment[] = paymentsData?.payments ?? [];

  const handleDeleteStudent = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/students');
      } else {
        toast('Eroare la ștergere', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_note', content: noteText }),
      });
      if (res.ok) {
        setNoteText('');
        mutate();
        toast('Notă adăugată', 'success');
      }
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    setDeletingNote(noteId);
    try {
      await fetch(`/api/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_note', note_id: noteId }),
      });
      mutate();
    } finally {
      setDeletingNote(null);
    }
  };

  const handleMarkComplete = async (lessonId: number) => {
    await fetch(`/api/lessons/${lessonId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    mutateLessons();
    toast('Lecție marcată ca finalizată', 'success');
  };

  if (!data) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="hidden lg:block"><Header title="Profil elev" /></div>
        <main className="flex-1 min-h-0 p-3 sm:p-6 space-y-3 overflow-hidden animate-page-enter">
          <div className="h-9 w-full rounded-lg bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
          <div className="h-40 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
          <div className="h-56 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <Header title="Elev negăsit" />
        <div className="flex-1 flex items-center justify-center">
          <Button onClick={() => router.push('/admin/students')} variant="secondary">
            <ArrowLeft className="w-4 h-4" /> Înapoi la Elevi
          </Button>
        </div>
      </div>
    );
  }

  const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="hidden lg:block">
        <Header title={student.name} subtitle={`${(student.instruments ?? []).join(', ')} · ${student.level}`} />
      </div>

      <main className={`flex-1 min-h-0 p-3 sm:p-6 space-y-3 sm:space-y-6 overflow-y-auto ${warmOnArrival ? 'animate-page-enter' : 'animate-fade-in'}`}>
        {/* Back + actions */}
        {/* Equal-width side columns keep the name exactly centred */}
        <div className="grid grid-cols-[5rem_1fr_5rem] items-center gap-2">
          <Button icon variant="secondary" onClick={goBack} title="Înapoi" aria-label="Înapoi" className="justify-self-start">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <p className="min-w-0 text-center text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            <span className="lg:hidden">{student.name}</span>
          </p>
          <div className="flex justify-end gap-2">
            <Button icon variant="secondary" onClick={() => setShowEdit(true)} title="Editează" aria-label="Editează">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button icon variant="danger" onClick={() => setShowDelete(true)} title="Șterge" aria-label="Șterge">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Profile card */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <span className="text-base sm:text-xl font-bold text-brand-600 dark:text-brand-400">{initials}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatBirthDate(student.birth_date)}</p>
                </div>
                <Badge variant={student.status === 'inactive' ? 'gray' : student.status === 'paused' ? 'yellow' : 'green'} className="ml-auto">
                  {STUDENT_STATUSES.find(s => s.value === (student.status ?? 'active'))?.label}
                </Badge>
              </div>

              <div className="space-y-2 sm:space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{student.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{student.email || '—'}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                  <Music2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {(student.instruments ?? []).map((instr: string) => (
                      <span key={instr} className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">{instr}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
                {(student.subscriptions?.length ?? 0) > 0 ? (
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Servicii:</p>
                    {student.subscriptions!.map(s => {
                      const stStatus = s.status ?? 'active';
                      const dotColor = stStatus === 'active' ? 'bg-emerald-500' : stStatus === 'paused' ? 'bg-amber-500' : 'bg-slate-400';
                      const stLabel = STUDENT_STATUSES.find(st => st.value === stStatus)?.label ?? stStatus;
                      return (
                        <p key={s.instrument} className="pl-2 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                          <span>{s.instrument}: <span className={s.teacher_name ? '' : 'italic'}>{s.teacher_name ?? 'Neatribuit'}</span> · {stLabel}</span>
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Profesor: {student.teacher_name ?? 'Neatribuit'}</p>
                )}
                <p className="text-xs text-slate-400">Cabinet: {student.cabinet_name ?? 'Neatribuit'}</p>
                {(student.parent_name || student.parent_phone) && (
                  <p className="text-xs text-slate-400">Părinte: {student.parent_name ?? '—'}{student.parent_phone ? ` · ${student.parent_phone}` : ''}</p>
                )}
                <p className="text-xs text-slate-400">Data înscrierii: {new Date(student.created_at).toLocaleDateString('ro-RO')}</p>
                <p className="text-xs text-slate-400">Total achitat: {totalPaid.toLocaleString()} MDL</p>
                {student.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 italic">
                    {student.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Statistici lunare — citite live din Program */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="px-3 py-2.5 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Statistici lunare</h3>
              </div>
              <StudentMonthlyStats studentId={student.id} />
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Lessons */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Lecții</h3>
                <Button size="sm" onClick={() => setShowLesson(true)}>
                  <Plus className="w-3.5 h-3.5" /> Adaugă
                </Button>
              </div>
              {lessons.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Nicio lecție încă</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lessons.slice(0, 8).map(lesson => (
                    <div key={lesson.id} className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-900 dark:text-slate-100">{lesson.date} la {lesson.time}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{lesson.duration}min · {lesson.teacher_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={lessonBadge(lesson.status)}>
                          {LESSON_STATUS_LABEL[lesson.status] ?? lesson.status}
                        </Badge>
                        {lesson.status === 'scheduled' && (
                          <Button icon variant="ghost" size="sm" onClick={() => handleMarkComplete(lesson.id)} title="Marchează finalizată">
                            ✓
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payments */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Plăți</h3>
                <Button size="sm" onClick={() => setShowPayment(true)}>
                  <Plus className="w-3.5 h-3.5" /> Înregistrează
                </Button>
              </div>
              {payments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Nicio plată încă</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.slice(0, 8).map(payment => (
                    <div key={payment.id} className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3">
                      <div>
                        <p className="text-sm text-slate-900 dark:text-slate-100">
                          {MONTHS[payment.month - 1]} {payment.year}
                        </p>
                        {payment.payment_date && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">Achitat {payment.payment_date}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={paymentBadge(payment.status)}>
                          {PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
                        </Badge>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{payment.amount} MDL</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Frecvență */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="px-3 py-2.5 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Frecvență</h3>
              </div>
              <StudentAttendanceGrid studentId={student.id} />
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="px-3 py-2.5 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Note de progres</h3>
              </div>
              <div className="p-3 sm:p-5 space-y-3">
                {/* Add note form */}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Adaugă o notă de progres…"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800
                      text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700
                      placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <Button type="submit" size="sm" disabled={savingNote || !noteText.trim()}>
                    Adaugă
                  </Button>
                </form>

                {/* Notes list */}
                {notes.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Nicio notă încă</p>
                ) : (
                  <div className="space-y-2">
                    {notes.map(note => (
                      <div key={note.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 dark:text-slate-300">{note.content}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(note.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deletingNote === note.id}
                          className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <StudentForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSaved={() => mutate()}
        student={student}
        showToast={toast}
      />
      <LessonForm
        open={showLesson}
        onClose={() => setShowLesson(false)}
        onSaved={() => mutateLessons()}
        defaultStudentId={student.id}
        showToast={toast}
      />
      <PaymentForm
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSaved={() => mutatePayments()}
        defaultStudentId={student.id}
        showToast={toast}
      />

      {/* Delete confirm */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Șterge elevul" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Ștergi definitiv elevul <strong className="text-slate-900 dark:text-slate-100">{student.name}</strong>?
          Toate lecțiile, plățile și notele lui vor fi șterse.
        </p>
        <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Anulează</Button>
          <Button variant="danger" onClick={handleDeleteStudent} disabled={deleting}>
            {deleting ? 'Se șterge…' : 'Șterge'}
          </Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
