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
import Modal from '@/components/ui/Modal';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Student, Lesson, Payment, StudentNote, MONTHS } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const router  = useRouter();
  const { toasts, toast, remove } = useToast();

  const { data, mutate } = useSWR(`/api/students/${id}`, fetcher);
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

  const student: Student | undefined = data?.student;
  const notes: StudentNote[] = data?.notes ?? [];
  const lessons: Lesson[] = lessonsData?.lessons ?? [];
  const payments: Payment[] = paymentsData?.payments ?? [];

  const handleDeleteStudent = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/students');
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
    toast('Lesson marked complete', 'success');
  };

  if (!data) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Profil elev" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400">Se încarcă…</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Elev negăsit" />
        <div className="flex-1 flex items-center justify-center">
          <Button onClick={() => router.push('/students')} variant="secondary">
            <ArrowLeft className="w-4 h-4" /> Înapoie la Elevi
          </Button>
        </div>
      </div>
    );
  }

  const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col flex-1">
      <Header title={student.name} subtitle={`${(student.instruments ?? []).join(', ')} · ${student.level}`} />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/students')}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="w-3.5 h-3.5" /> Editează
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{initials}</span>
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Vârstă {student.age}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{student.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{student.email}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                  <Music2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {(student.instruments ?? []).map((instr: string) => (
                      <span key={instr} className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{instr}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400">Profesor: {student.teacher_name ?? 'Neatribuit'}</p>
                <p className="text-xs text-slate-400 mt-1">Total achitat: {totalPaid.toLocaleString()} MDL</p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Lessons */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Lecții</h3>
                <Button size="sm" onClick={() => setShowLesson(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              {lessons.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Nicio lecție încă</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lessons.slice(0, 8).map(lesson => (
                    <div key={lesson.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-900 dark:text-slate-100">{lesson.date} la {lesson.time}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{lesson.duration}min · {lesson.teacher_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={lessonBadge(lesson.status)}>
                          {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                        </Badge>
                        {lesson.status === 'scheduled' && (
                          <Button variant="ghost" size="sm" onClick={() => handleMarkComplete(lesson.id)}>
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
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
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
                    <div key={payment.id} className="flex items-center justify-between px-5 py-3">
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
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{payment.amount} MDL</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Note de progres</h3>
              </div>
              <div className="p-5 space-y-3">
                {/* Add note form */}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Adaugă o notă de progres…"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800
                      text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700
                      placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Student" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Permanently delete <strong className="text-slate-900 dark:text-slate-100">{student.name}</strong>?
          All lessons, payments and notes will be removed.
        </p>
        <div className="flex justify-end gap-3">
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
