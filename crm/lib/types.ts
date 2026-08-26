// TypeScript interfaces for the Music School CRM

export interface Registration {
  id: number;
  name: string;
  phone: string;
  email: string;
  age: string | null;
  course: string | null;
  message: string | null;
  status: 'nou' | 'contactat' | 'inscris' | 'anulat';
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | null;
  status: 'pending' | 'approved' | 'rejected';
  teacher_id?: number | null;
  created_at: string;
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  bio?: string;
  birth_date?: string | null; // YYYY-MM-DD
  created_at: string;
}

export type StudentStatus = 'active' | 'inactive' | 'paused';

export interface Student {
  id: number;
  name: string;
  /** @deprecated superseded by birth_date — kept only for old rows that never got one */
  age?: number;
  birth_date?: string | null; // YYYY-MM-DD
  phone: string;
  email: string;
  instruments: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  monthly_fee: number;
  teacher_id?: number;
  teacher_name?: string;
  cabinet_id?: number | null;
  cabinet_name?: string | null;
  notes?: string | null;
  status?: StudentStatus;
  created_at: string;
}

export const STUDENT_STATUSES: { value: StudentStatus; label: string }[] = [
  { value: 'active',   label: 'Activ' },
  { value: 'paused',   label: 'Pauză' },
  { value: 'inactive', label: 'Inactiv' },
];

export interface Lesson {
  id: number;
  student_id: number;
  student_name?: string;
  teacher_id: number;
  teacher_name?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'recovered';
  notes?: string;
  cabinet_id?: number | null;
  cabinet_name?: string | null;
  cabinet_color?: string | null;
  discipline?: string | null;
  recurring_schedule_id?: number | null;
  is_customized?: boolean;
  created_at: string;
}

export interface RecurringSchedule {
  id: number;
  student_id: number;
  student_name?: string;
  teacher_id: number;
  teacher_name?: string;
  discipline?: string | null;
  cabinet_id?: number | null;
  cabinet_name?: string | null;
  day_of_week: number; // 0=Sun … 6=Sat
  start_time: string; // 'HH:MM'
  end_time: string;   // 'HH:MM'
  notes?: string | null;
  active: boolean;
  generated_until?: string | null;
  created_at: string;
}

export type AttendanceStatus = 'present' | 'excused_absence' | 'unexcused_absence' | 'late';

export interface Attendance {
  id: number;
  lesson_id: number;
  status: AttendanceStatus;
  notes?: string | null;
  marked_by_name?: string | null;
  // Enriched fields joined in from `lessons` for list/register views
  date?: string;
  time?: string;
  discipline?: string | null;
  student_id?: number;
  student_name?: string;
  teacher_id?: number;
  teacher_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Audition {
  id: number;
  student_id: number;
  student_name?: string;
  teacher_id?: number | null;
  teacher_name?: string | null;
  discipline?: string | null;
  date: string;
  time: string;
  duration: number;
  notes?: string | null;
  result?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
}

export interface CabinetDayStatus {
  id: number;
  cabinet_id: number;
  day_of_week: number; // 0=Sun … 6=Sat
  status: 'liber' | 'ocupat';
  updated_at: string;
}

/** Live-computed monthly counters — always derived from `lessons`/`attendance`, never stored. */
export interface MonthlyStats {
  student_id?: number;
  student_name?: string;
  teacher_id?: number;
  teacher_name?: string;
  discipline?: string | null;
  /** All lessons that month, any status. */
  total: number;
  /** Still pending — status literally 'scheduled' (not yet completed/cancelled/recovered). */
  scheduled: number;
  completed: number;
  cancelled: number;
  recovered: number;
  present: number;
  excused_absence: number;
  unexcused_absence: number;
  students?: string[]; // for per-teacher stats: distinct students worked with that month
}

export const DAYS_OF_WEEK = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

export const ATTENDANCE_STATUSES: { value: AttendanceStatus; label: string; short: string }[] = [
  { value: 'present',            label: 'Prezent',            short: 'P' },
  { value: 'excused_absence',    label: 'Absență motivată',   short: 'AM' },
  { value: 'unexcused_absence',  label: 'Absență nemotivată', short: 'AN' },
  { value: 'late',                label: 'Întârziere',         short: 'Î' },
];

export interface Cabinet {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface CabinetTeacherAssignment {
  id: number;
  cabinet_id: number;
  teacher_id: number | null;
  teacher_name?: string | null;
  day_of_week: number; // 0=Sun, 1=Mon … 6=Sat
}

export interface Payment {
  id: number;
  student_id: number;
  student_name?: string;
  instruments?: string[];
  amount: number;
  month: number; // 1-12
  year: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  due_date?: string;       // YYYY-MM-DD
  payment_date?: string;
  paid_at?: string | null; // ISO timestamp
  notes?: string;
  created_at: string;
}

export interface StudentNote {
  id: number;
  student_id: number;
  content: string;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalMonthlyIncome: number;
  upcomingLessonsToday: number;
  pendingPayments: number;
  totalTeachers: number;
  completedLessonsThisMonth: number;
  paidThisMonth: number;
  unpaidCount: number;
}

export type Instrument =
  | 'Piano'
  | 'Chitară'
  | 'Tobe'
  | 'Canto'
  | 'Teoria muzicii'
  | 'Solfegiu';

export type Level = 'beginner' | 'intermediate' | 'advanced';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'overdue';
export type LessonStatus = 'scheduled' | 'completed' | 'cancelled';

export const INSTRUMENTS: Instrument[] = [
  'Piano', 'Chitară', 'Tobe', 'Canto', 'Teoria muzicii', 'Solfegiu',
];

export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

export const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];
