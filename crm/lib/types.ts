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
  created_at: string;
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  bio?: string;
  created_at: string;
}

export interface Student {
  id: number;
  name: string;
  age: number;
  phone: string;
  email: string;
  instruments: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  monthly_fee: number;
  teacher_id?: number;
  teacher_name?: string;
  created_at: string;
}

export interface Lesson {
  id: number;
  student_id: number;
  student_name?: string;
  teacher_id: number;
  teacher_name?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  cabinet_id?: number | null;
  cabinet_name?: string | null;
  cabinet_color?: string | null;
  created_at: string;
}

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
