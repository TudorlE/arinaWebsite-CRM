/**
 * Database module: SQLite connection, schema initialization, and CRUD helpers.
 * Uses better-sqlite3 (synchronous) with a global singleton for Next.js dev hot-reload.
 */
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { seedStudents, seedTeachers } from './seed-data';

const DB_PATH = path.join(process.cwd(), 'arrycrm.db');

// Singleton pattern prevents multiple connections during Next.js hot reload
declare global {
  var _arryDb: Database.Database | undefined;
}

function getDb(): Database.Database {
  if (global._arryDb) return global._arryDb;

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initializeTables(db);

  global._arryDb = db;
  return db;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

function initializeTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT,
      google_id     TEXT    UNIQUE,
      role          TEXT,
      status        TEXT    NOT NULL DEFAULT 'pending',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      phone      TEXT NOT NULL,
      bio        TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      age         INTEGER NOT NULL,
      phone       TEXT    NOT NULL,
      email       TEXT    NOT NULL,
      instrument  TEXT    NOT NULL,
      level       TEXT    NOT NULL DEFAULT 'beginner',
      monthly_fee REAL    NOT NULL DEFAULT 100,
      teacher_id  INTEGER REFERENCES teachers(id),
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      teacher_id INTEGER NOT NULL REFERENCES teachers(id),
      date       TEXT    NOT NULL,
      time       TEXT    NOT NULL,
      duration   INTEGER NOT NULL DEFAULT 60,
      status     TEXT    NOT NULL DEFAULT 'scheduled',
      notes      TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id   INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      amount       REAL    NOT NULL,
      month        INTEGER NOT NULL,
      year         INTEGER NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'unpaid',
      payment_date TEXT,
      notes        TEXT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      content    TEXT    NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed on first run
  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (count === 0) seedDatabase(db);

  // Migration: ensure 'status' column exists on legacy databases
  try {
    const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string; notnull: number }[];
    if (!cols.some(c => c.name === 'status')) {
      db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'");
    }
    // Migration: drop NOT NULL constraint on `role` so new pending users can have null role
    const roleCol = cols.find(c => c.name === 'role');
    if (roleCol && roleCol.notnull === 1) {
      db.exec(`
        BEGIN TRANSACTION;
        CREATE TABLE users_new (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          name          TEXT    NOT NULL,
          email         TEXT    UNIQUE NOT NULL,
          password_hash TEXT,
          google_id     TEXT    UNIQUE,
          role          TEXT,
          status        TEXT    NOT NULL DEFAULT 'pending',
          created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO users_new (id, name, email, password_hash, role, status, created_at)
          SELECT id, name, email, password_hash, role, status, created_at FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
        COMMIT;
      `);
    }
    // Migration: add google_id column
    const colsLatest = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    if (!colsLatest.some(c => c.name === 'google_id')) {
      db.exec(`
        BEGIN TRANSACTION;
        CREATE TABLE users_new (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          name          TEXT    NOT NULL,
          email         TEXT    UNIQUE NOT NULL,
          password_hash TEXT,
          google_id     TEXT    UNIQUE,
          role          TEXT,
          status        TEXT    NOT NULL DEFAULT 'pending',
          created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO users_new (id, name, email, password_hash, role, status, created_at)
          SELECT id, name, email, password_hash, role, status, created_at FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
        COMMIT;
      `);
    }
    // Migration: add teacher_id column — links a `role='teacher'` user to their
    // Supabase `teachers` row (no real FK possible across the two databases).
    const colsForTeacherLink = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    if (!colsForTeacherLink.some(c => c.name === 'teacher_id')) {
      db.exec('ALTER TABLE users ADD COLUMN teacher_id INTEGER');
    }
  } catch (e) { console.error('[db migration]', e); }
}

// ─── Seeder ───────────────────────────────────────────────────────────────────

function seedDatabase(db: Database.Database): void {
  const adminHash = bcrypt.hashSync('music123', 10);
  db.prepare('INSERT INTO users (name, email, password_hash, role, status) VALUES (?,?,?,?,?)')
    .run('Admin', 'admin@arrymusic.com', adminHash, 'admin', 'approved');

  seedTeachers.forEach(t =>
    db.prepare('INSERT INTO teachers (name,email,phone,bio) VALUES (?,?,?,?)').run(t.name, t.email, t.phone, t.bio)
  );

  seedStudents.forEach(s =>
    db.prepare('INSERT INTO students (name,age,phone,email,instrument,level,monthly_fee,teacher_id) VALUES (?,?,?,?,?,?,?,?)')
      .run(s.name, s.age, s.phone, s.email, s.instrument, s.level, s.monthly_fee, s.teacher_id)
  );

  // Sample lessons spread over next 14 days
  const students = db.prepare('SELECT id, teacher_id FROM students').all() as { id: number; teacher_id: number }[];
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  const today = new Date();

  students.slice(0, 20).forEach((s, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (i % 10));
    const dateStr = d.toISOString().split('T')[0];
    const time = times[i % times.length];
    const status = i < 6 ? 'completed' : 'scheduled';
    db.prepare('INSERT INTO lessons (student_id,teacher_id,date,time,duration,status) VALUES (?,?,?,?,?,?)')
      .run(s.id, s.teacher_id || 1, dateStr, time, 60, status);
  });

  // Sample payments: previous month all paid, current month partially paid
  const cm = today.getMonth() + 1;
  const cy = today.getFullYear();
  const pm = cm === 1 ? 12 : cm - 1;
  const py = cm === 1 ? cy - 1 : cy;

  students.forEach((s, i) => {
    const fee = (db.prepare('SELECT monthly_fee FROM students WHERE id=?').get(s.id) as { monthly_fee: number }).monthly_fee;
    const pmStr = `${py}-${String(pm).padStart(2, '0')}-05`;
    db.prepare('INSERT INTO payments (student_id,amount,month,year,status,payment_date) VALUES (?,?,?,?,?,?)')
      .run(s.id, fee, pm, py, 'paid', pmStr);
    const cmStatus = i < 18 ? 'paid' : 'unpaid';
    const cmDate = i < 18 ? `${cy}-${String(cm).padStart(2, '0')}-01` : null;
    db.prepare('INSERT INTO payments (student_id,amount,month,year,status,payment_date) VALUES (?,?,?,?,?,?)')
      .run(s.id, fee, cm, cy, cmStatus, cmDate);
  });

  // Sample notes
  const note = db.prepare('INSERT INTO student_notes (student_id,content) VALUES (?,?)');
  note.run(1, 'Great progress on Beethoven Sonata No. 14. Ready for the next piece.');
  note.run(1, 'Needs to practice scales more regularly — left hand coordination needs work.');
  note.run(2, 'Excellent fingerpicking technique. Working on advanced chord transitions.');
  note.run(3, 'Good bow control. Focus on intonation in higher positions.');
}

// ─── Allowed field whitelists (prevent SQL injection via dynamic UPDATE) ───────

const STUDENT_FIELDS = new Set(['name', 'age', 'phone', 'email', 'instrument', 'level', 'monthly_fee', 'teacher_id']);
const LESSON_FIELDS  = new Set(['date', 'time', 'duration', 'status', 'notes', 'teacher_id']);
const PAYMENT_FIELDS = new Set(['amount', 'status', 'payment_date', 'notes']);
const TEACHER_FIELDS = new Set(['name', 'email', 'phone', 'bio']);

function buildUpdate(data: Record<string, unknown>, allowed: Set<string>) {
  const entries = Object.entries(data).filter(([k]) => allowed.has(k));
  const fields = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  return { fields, values };
}

// ─── Student helpers ──────────────────────────────────────────────────────────

export function getStudents(search?: string, instrument?: string, level?: string) {
  const db = getDb();
  let q = 'SELECT s.*, t.name as teacher_name FROM students s LEFT JOIN teachers t ON s.teacher_id = t.id WHERE 1=1';
  const params: unknown[] = [];

  if (search) {
    q += ' AND (s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)';
    const p = `%${search}%`;
    params.push(p, p, p);
  }
  if (instrument) { q += ' AND s.instrument = ?'; params.push(instrument); }
  if (level)      { q += ' AND s.level = ?';      params.push(level); }

  q += ' ORDER BY s.name ASC';
  return db.prepare(q).all(...params);
}

export function getStudentById(id: number) {
  return getDb().prepare(
    'SELECT s.*, t.name as teacher_name FROM students s LEFT JOIN teachers t ON s.teacher_id = t.id WHERE s.id = ?'
  ).get(id);
}

export function createStudent(data: Record<string, unknown>) {
  const db = getDb();
  const r = db.prepare(
    'INSERT INTO students (name,age,phone,email,instrument,level,monthly_fee,teacher_id) VALUES (?,?,?,?,?,?,?,?)'
  ).run(data.name, data.age, data.phone, data.email, data.instrument, data.level, data.monthly_fee, data.teacher_id ?? null);
  return getStudentById(r.lastInsertRowid as number);
}

export function updateStudent(id: number, data: Record<string, unknown>) {
  const db = getDb();
  const { fields, values } = buildUpdate(data, STUDENT_FIELDS);
  if (!fields) return getStudentById(id);
  db.prepare(`UPDATE students SET ${fields} WHERE id = ?`).run(...values, id);
  return getStudentById(id);
}

export function deleteStudent(id: number) {
  getDb().prepare('DELETE FROM students WHERE id = ?').run(id);
}

// ─── Lesson helpers ───────────────────────────────────────────────────────────

export function getLessons(studentId?: number, date?: string, status?: string, teacherId?: number) {
  const db = getDb();
  let q = `SELECT l.*, s.name as student_name, t.name as teacher_name
           FROM lessons l
           JOIN students s ON l.student_id = s.id
           JOIN teachers t ON l.teacher_id = t.id
           WHERE 1=1`;
  const params: unknown[] = [];

  if (studentId) { q += ' AND l.student_id = ?'; params.push(studentId); }
  if (date)      { q += ' AND l.date = ?';        params.push(date); }
  if (status)    { q += ' AND l.status = ?';      params.push(status); }
  if (teacherId) { q += ' AND l.teacher_id = ?';  params.push(teacherId); }

  q += ' ORDER BY l.date DESC, l.time ASC';
  return db.prepare(q).all(...params);
}

export function getLessonById(id: number) {
  return getDb().prepare(
    `SELECT l.*, s.name as student_name, t.name as teacher_name
     FROM lessons l
     JOIN students s ON l.student_id = s.id
     JOIN teachers t ON l.teacher_id = t.id
     WHERE l.id = ?`
  ).get(id);
}

export function createLesson(data: Record<string, unknown>) {
  const db = getDb();
  const r = db.prepare(
    'INSERT INTO lessons (student_id,teacher_id,date,time,duration,notes,status) VALUES (?,?,?,?,?,?,?)'
  ).run(data.student_id, data.teacher_id, data.date, data.time, data.duration, data.notes ?? null, 'scheduled');
  return getLessonById(r.lastInsertRowid as number);
}

export function updateLesson(id: number, data: Record<string, unknown>) {
  const db = getDb();
  const { fields, values } = buildUpdate(data, LESSON_FIELDS);
  if (!fields) return getLessonById(id);
  db.prepare(`UPDATE lessons SET ${fields} WHERE id = ?`).run(...values, id);
  return getLessonById(id);
}

export function deleteLesson(id: number) {
  getDb().prepare('DELETE FROM lessons WHERE id = ?').run(id);
}

// ─── Payment helpers ──────────────────────────────────────────────────────────

export function getPayments(studentId?: number, month?: number, year?: number, status?: string) {
  const db = getDb();
  let q = `SELECT p.*, s.name as student_name, s.instrument
           FROM payments p
           JOIN students s ON p.student_id = s.id
           WHERE 1=1`;
  const params: unknown[] = [];

  if (studentId) { q += ' AND p.student_id = ?'; params.push(studentId); }
  if (month)     { q += ' AND p.month = ?';       params.push(month); }
  if (year)      { q += ' AND p.year = ?';        params.push(year); }
  if (status)    { q += ' AND p.status = ?';      params.push(status); }

  q += ' ORDER BY p.year DESC, p.month DESC, s.name ASC';
  return db.prepare(q).all(...params);
}

export function getPaymentById(id: number) {
  return getDb().prepare(
    'SELECT p.*, s.name as student_name FROM payments p JOIN students s ON p.student_id = s.id WHERE p.id = ?'
  ).get(id);
}

export function createPayment(data: Record<string, unknown>) {
  const db = getDb();
  const r = db.prepare(
    'INSERT INTO payments (student_id,amount,month,year,status,payment_date,notes) VALUES (?,?,?,?,?,?,?)'
  ).run(data.student_id, data.amount, data.month, data.year, data.status, data.payment_date ?? null, data.notes ?? null);
  return getPaymentById(r.lastInsertRowid as number);
}

export function updatePayment(id: number, data: Record<string, unknown>) {
  const db = getDb();
  const { fields, values } = buildUpdate(data, PAYMENT_FIELDS);
  if (!fields) return getPaymentById(id);
  db.prepare(`UPDATE payments SET ${fields} WHERE id = ?`).run(...values, id);
  return getPaymentById(id);
}

export function deletePayment(id: number) {
  getDb().prepare('DELETE FROM payments WHERE id = ?').run(id);
}

// ─── Teacher helpers ──────────────────────────────────────────────────────────

export function getTeachers() {
  return getDb().prepare('SELECT * FROM teachers ORDER BY name ASC').all();
}

export function getTeacherById(id: number) {
  return getDb().prepare('SELECT * FROM teachers WHERE id = ?').get(id);
}

export function createTeacher(data: Record<string, unknown>) {
  const db = getDb();
  const r = db.prepare('INSERT INTO teachers (name,email,phone,bio) VALUES (?,?,?,?)')
    .run(data.name, data.email, data.phone, data.bio ?? null);
  return getTeacherById(r.lastInsertRowid as number);
}

export function updateTeacher(id: number, data: Record<string, unknown>) {
  const db = getDb();
  const { fields, values } = buildUpdate(data, TEACHER_FIELDS);
  if (!fields) return getTeacherById(id);
  db.prepare(`UPDATE teachers SET ${fields} WHERE id = ?`).run(...values, id);
  return getTeacherById(id);
}

export function deleteTeacher(id: number) {
  getDb().prepare('DELETE FROM teachers WHERE id = ?').run(id);
}

// ─── Notes helpers ────────────────────────────────────────────────────────────

export function getNotesByStudent(studentId: number) {
  return getDb().prepare(
    'SELECT * FROM student_notes WHERE student_id = ? ORDER BY created_at DESC'
  ).all(studentId);
}

export function createNote(studentId: number, content: string) {
  const db = getDb();
  const r = db.prepare('INSERT INTO student_notes (student_id,content) VALUES (?,?)').run(studentId, content);
  return db.prepare('SELECT * FROM student_notes WHERE id = ?').get(r.lastInsertRowid);
}

export function deleteNote(id: number) {
  getDb().prepare('DELETE FROM student_notes WHERE id = ?').run(id);
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string | null;
  status: 'pending' | 'approved' | 'rejected';
  teacher_id: number | null;
  created_at: string;
}

export function getUserByEmail(email: string) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | { id: number; name: string; email: string; password_hash: string; role: string | null; status: 'pending' | 'approved' | 'rejected'; teacher_id: number | null; created_at: string }
    | undefined;
}

export function getUserById(id: number) {
  return getDb().prepare('SELECT id, name, email, role, status, teacher_id, created_at FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function getAllUsers(status?: string) {
  if (status) {
    return getDb()
      .prepare('SELECT id, name, email, role, status, teacher_id, created_at FROM users WHERE status = ? ORDER BY id ASC')
      .all(status) as UserRow[];
  }
  return getDb()
    .prepare('SELECT id, name, email, role, status, teacher_id, created_at FROM users ORDER BY id ASC')
    .all() as UserRow[];
}

export function createUser(data: { name: string; email: string; password_hash: string; role?: string | null; status?: string }) {
  const info = getDb()
    .prepare('INSERT INTO users (name, email, password_hash, role, status) VALUES (?,?,?,?,?)')
    .run(data.name, data.email, data.password_hash, data.role ?? null, data.status ?? 'pending');
  return getUserById(Number(info.lastInsertRowid));
}

export function approveUser(id: number, role: string, teacherId?: number | null) {
  if (role === 'teacher' && teacherId != null) {
    getDb().prepare("UPDATE users SET status = 'approved', role = ?, teacher_id = ? WHERE id = ?").run(role, teacherId, id);
  } else {
    getDb().prepare("UPDATE users SET status = 'approved', role = ? WHERE id = ?").run(role, id);
  }
  return getUserById(id);
}

export function rejectUser(id: number) {
  getDb().prepare("UPDATE users SET status = 'rejected' WHERE id = ?").run(id);
  return getUserById(id);
}

export function updateUserRole(id: number, role: string) {
  getDb().prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  return getUserById(id);
}

export function updateUserPassword(id: number, passwordHash: string) {
  getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
}

export function findOrCreateGoogleUser(googleId: string, name: string, email: string): UserRow {
  const db = getDb();
  // 1. Find by google_id
  let user = db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE google_id = ?').get(googleId) as UserRow | undefined;
  if (user) return user;
  // 2. Link by email (existing account)
  const existing = db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (existing) {
    db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleId, existing.id);
    return existing;
  }
  // 3. Create new pending user
  const info = db.prepare("INSERT INTO users (name, email, google_id, password_hash, role, status) VALUES (?,?,?,NULL,NULL,'pending')")
    .run(name, email, googleId);
  return getUserById(Number(info.lastInsertRowid))!;
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export function getDashboardStats() {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const cm = new Date().getMonth() + 1;
  const cy = new Date().getFullYear();
  const cmStr = String(cm).padStart(2, '0');

  const g = <T>(sql: string, ...p: unknown[]) =>
    (db.prepare(sql).get(...p) as T);

  return {
    totalStudents:             g<{ c: number }>('SELECT COUNT(*) as c FROM students').c,
    totalMonthlyIncome:        g<{ t: number }>('SELECT COALESCE(SUM(monthly_fee),0) as t FROM students').t,
    upcomingLessonsToday:      g<{ c: number }>('SELECT COUNT(*) as c FROM lessons WHERE date=? AND status=?', today, 'scheduled').c,
    pendingPayments:           g<{ c: number }>('SELECT COUNT(*) as c FROM payments WHERE month=? AND year=? AND status!=?', cm, cy, 'paid').c,
    totalTeachers:             g<{ c: number }>('SELECT COUNT(*) as c FROM teachers').c,
    completedLessonsThisMonth: g<{ c: number }>('SELECT COUNT(*) as c FROM lessons WHERE strftime(\'%m\',date)=? AND strftime(\'%Y\',date)=? AND status=?', cmStr, String(cy), 'completed').c,
    paidThisMonth:             g<{ t: number }>('SELECT COALESCE(SUM(amount),0) as t FROM payments WHERE month=? AND year=? AND status=?', cm, cy, 'paid').t,
    unpaidCount:               g<{ c: number }>('SELECT COUNT(*) as c FROM payments WHERE month=? AND year=? AND status=?', cm, cy, 'unpaid').c,
  };
}

export default getDb;
