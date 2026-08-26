/**
 * Database module: SQLite connection, schema initialization, and CRUD helpers.
 * Uses better-sqlite3 (synchronous) with a global singleton for Next.js hot-reload.
 */
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { seedStudents, seedTeachers } from './seed-data';

// Vercel's deployment filesystem is read-only outside /tmp, so the demo DB
// lives in /tmp in production (ephemeral per instance, reseeds on cold start).
const DB_PATH = process.env.VERCEL
  ? '/tmp/arrycrm.db'
  : path.join(process.cwd(), 'arrycrm.db');

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
      instruments TEXT    NOT NULL DEFAULT '[]',
      level       TEXT    NOT NULL DEFAULT 'beginner',
      monthly_fee REAL    NOT NULL DEFAULT 100,
      teacher_id  INTEGER REFERENCES teachers(id),
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cabinets (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      color      TEXT NOT NULL DEFAULT '#6366f1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cabinet_teacher_assignments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      cabinet_id  INTEGER NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL,
      teacher_id  INTEGER REFERENCES teachers(id),
      UNIQUE(cabinet_id, day_of_week)
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      teacher_id INTEGER NOT NULL REFERENCES teachers(id),
      cabinet_id INTEGER REFERENCES cabinets(id),
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
      due_date     TEXT,
      payment_date TEXT,
      paid_at      TEXT,
      notes        TEXT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      content    TEXT    NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      phone      TEXT NOT NULL,
      email      TEXT NOT NULL,
      age        TEXT,
      course     TEXT,
      message    TEXT,
      status     TEXT NOT NULL DEFAULT 'nou',
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
    db.prepare('INSERT INTO students (name,age,phone,email,instruments,level,monthly_fee,teacher_id) VALUES (?,?,?,?,?,?,?,?)')
      .run(s.name, s.age, s.phone, s.email, JSON.stringify([s.instrument]), s.level, s.monthly_fee, s.teacher_id)
  );

  // Cabinets + a couple of weekday assignments
  const cabinetIds: number[] = [];
  [['Sala 1', '#6366f1'], ['Sala 2', '#22c55e'], ['Sala 3', '#f59e0b']].forEach(([name, color]) => {
    const r = db.prepare('INSERT INTO cabinets (name,color) VALUES (?,?)').run(name, color);
    cabinetIds.push(r.lastInsertRowid as number);
  });
  const teacherIds = (db.prepare('SELECT id FROM teachers ORDER BY id').all() as { id: number }[]).map(t => t.id);
  [1, 2, 3, 4, 5].forEach((day, i) => {
    db.prepare('INSERT INTO cabinet_teacher_assignments (cabinet_id,day_of_week,teacher_id) VALUES (?,?,?)')
      .run(cabinetIds[i % cabinetIds.length], day, teacherIds[i % teacherIds.length]);
  });

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
    db.prepare('INSERT INTO lessons (student_id,teacher_id,cabinet_id,date,time,duration,status) VALUES (?,?,?,?,?,?,?)')
      .run(s.id, s.teacher_id || 1, cabinetIds[i % cabinetIds.length], dateStr, time, 60, status);
  });

  // Sample payments: previous month all paid, current month partially paid
  const cm = today.getMonth() + 1;
  const cy = today.getFullYear();
  const pm = cm === 1 ? 12 : cm - 1;
  const py = cm === 1 ? cy - 1 : cy;

  students.forEach((s, i) => {
    const fee = (db.prepare('SELECT monthly_fee FROM students WHERE id=?').get(s.id) as { monthly_fee: number }).monthly_fee;
    const pmStr = `${py}-${String(pm).padStart(2, '0')}-05`;
    db.prepare('INSERT INTO payments (student_id,amount,month,year,status,due_date,payment_date,paid_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(s.id, fee, pm, py, 'paid', buildDueDateInternal(pm, py), pmStr, `${pmStr}T00:00:00.000Z`);
    const cmStatus = i < 18 ? 'paid' : 'unpaid';
    const cmDate = i < 18 ? `${cy}-${String(cm).padStart(2, '0')}-01` : null;
    db.prepare('INSERT INTO payments (student_id,amount,month,year,status,due_date,payment_date,paid_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(s.id, fee, cm, cy, cmStatus, buildDueDateInternal(cm, cy), cmDate, cmDate ? `${cmDate}T00:00:00.000Z` : null);
  });

  // Sample notes
  const note = db.prepare('INSERT INTO student_notes (student_id,content) VALUES (?,?)');
  note.run(1, 'Great progress on Beethoven Sonata No. 14. Ready for the next piece.');
  note.run(1, 'Needs to practice scales more regularly — left hand coordination needs work.');
  note.run(2, 'Excellent fingerpicking technique. Working on advanced chord transitions.');
  note.run(3, 'Good bow control. Focus on intonation in higher positions.');

  // Sample registrations (as if submitted from the public website)
  const reg = db.prepare('INSERT INTO registrations (name,phone,email,age,course,message,status) VALUES (?,?,?,?,?,?,?)');
  reg.run('Ana Popescu', '0722-111-222', 'ana.popescu@example.com', '9', 'Piano', 'Vreau să încep de la zero.', 'nou');
  reg.run('Mihai Ionescu', '0733-222-333', 'mihai.ionescu@example.com', '14', 'Chitară', null, 'contactat');
}

function buildDueDateInternal(month: number, year: number, day = 10): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Allowed field whitelists (prevent SQL injection via dynamic UPDATE) ───────

const STUDENT_FIELDS = new Set(['name', 'age', 'phone', 'email', 'level', 'monthly_fee', 'teacher_id']);
const LESSON_FIELDS  = new Set(['student_id', 'teacher_id', 'cabinet_id', 'date', 'time', 'duration', 'status', 'notes']);
const PAYMENT_FIELDS = new Set(['student_id', 'amount', 'month', 'year', 'status', 'due_date', 'payment_date', 'paid_at', 'notes']);
const TEACHER_FIELDS = new Set(['name', 'email', 'phone', 'bio']);
const CABINET_FIELDS = new Set(['name', 'color']);

function buildUpdate(data: Record<string, unknown>, allowed: Set<string>) {
  const entries = Object.entries(data).filter(([k]) => allowed.has(k));
  const fields = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  return { fields, values };
}

function parseStudentRow<T extends { instruments?: unknown }>(row: T | undefined): (Omit<T, 'instruments'> & { instruments: string[] }) | undefined {
  if (!row) return undefined;
  let instruments: string[] = [];
  try { instruments = JSON.parse((row as { instruments?: string }).instruments ?? '[]'); } catch { instruments = []; }
  return { ...row, instruments };
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
  if (level) { q += ' AND s.level = ?'; params.push(level); }

  q += ' ORDER BY s.name ASC';
  let rows = (db.prepare(q).all(...params) as Record<string, unknown>[]).map(r => parseStudentRow(r)!);

  if (instrument) rows = rows.filter(r => r.instruments.includes(instrument));
  return rows;
}

export function getStudentById(id: number) {
  const row = getDb().prepare(
    'SELECT s.*, t.name as teacher_name FROM students s LEFT JOIN teachers t ON s.teacher_id = t.id WHERE s.id = ?'
  ).get(id) as Record<string, unknown> | undefined;
  return parseStudentRow(row);
}

export function createStudent(data: Record<string, unknown>) {
  const db = getDb();
  const instruments = Array.isArray(data.instruments) ? data.instruments : [];
  const r = db.prepare(
    'INSERT INTO students (name,age,phone,email,instruments,level,monthly_fee,teacher_id) VALUES (?,?,?,?,?,?,?,?)'
  ).run(data.name, data.age, data.phone, data.email, JSON.stringify(instruments), data.level, data.monthly_fee, data.teacher_id ?? null);
  return getStudentById(r.lastInsertRowid as number);
}

export function updateStudent(id: number, data: Record<string, unknown>) {
  const db = getDb();
  const patch = { ...data } as Record<string, unknown>;
  if (Array.isArray(patch.instruments)) {
    db.prepare('UPDATE students SET instruments = ? WHERE id = ?').run(JSON.stringify(patch.instruments), id);
  }
  const { fields, values } = buildUpdate(patch, STUDENT_FIELDS);
  if (fields) db.prepare(`UPDATE students SET ${fields} WHERE id = ?`).run(...values, id);
  return getStudentById(id);
}

export function deleteStudent(id: number) {
  getDb().prepare('DELETE FROM students WHERE id = ?').run(id);
}

// ─── Lesson helpers ───────────────────────────────────────────────────────────

export function getLessons(studentId?: number, date?: string, status?: string, teacherId?: number, cabinetId?: number) {
  const db = getDb();
  let q = `SELECT l.*, s.name as student_name, t.name as teacher_name, c.name as cabinet_name, c.color as cabinet_color
           FROM lessons l
           JOIN students s ON l.student_id = s.id
           JOIN teachers t ON l.teacher_id = t.id
           LEFT JOIN cabinets c ON l.cabinet_id = c.id
           WHERE 1=1`;
  const params: unknown[] = [];

  if (studentId) { q += ' AND l.student_id = ?'; params.push(studentId); }
  if (date)      { q += ' AND l.date = ?';        params.push(date); }
  if (status)    { q += ' AND l.status = ?';      params.push(status); }
  if (teacherId) { q += ' AND l.teacher_id = ?';  params.push(teacherId); }
  if (cabinetId) { q += ' AND l.cabinet_id = ?';  params.push(cabinetId); }

  q += ' ORDER BY l.date DESC, l.time ASC';
  return db.prepare(q).all(...params);
}

export function getLessonById(id: number) {
  return getDb().prepare(
    `SELECT l.*, s.name as student_name, t.name as teacher_name, c.name as cabinet_name, c.color as cabinet_color
     FROM lessons l
     JOIN students s ON l.student_id = s.id
     JOIN teachers t ON l.teacher_id = t.id
     LEFT JOIN cabinets c ON l.cabinet_id = c.id
     WHERE l.id = ?`
  ).get(id);
}

export function createLesson(data: Record<string, unknown>) {
  const db = getDb();
  const r = db.prepare(
    'INSERT INTO lessons (student_id,teacher_id,cabinet_id,date,time,duration,notes,status) VALUES (?,?,?,?,?,?,?,?)'
  ).run(
    data.student_id, data.teacher_id, data.cabinet_id ?? null,
    data.date, data.time, data.duration, data.notes ?? null, 'scheduled'
  );
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
  let q = `SELECT p.*, s.name as student_name, s.instruments
           FROM payments p
           JOIN students s ON p.student_id = s.id
           WHERE 1=1`;
  const params: unknown[] = [];

  if (studentId) { q += ' AND p.student_id = ?'; params.push(studentId); }
  if (month)     { q += ' AND p.month = ?';       params.push(month); }
  if (year)      { q += ' AND p.year = ?';        params.push(year); }
  if (status)    { q += ' AND p.status = ?';      params.push(status); }

  q += ' ORDER BY p.year DESC, p.month DESC, s.name ASC';
  const rows = db.prepare(q).all(...params) as Record<string, unknown>[];
  return rows.map(r => {
    let instruments: string[] = [];
    try { instruments = JSON.parse((r.instruments as string) ?? '[]'); } catch { instruments = []; }
    return { ...r, instruments };
  });
}

export function getPaymentById(id: number) {
  const row = getDb().prepare(
    'SELECT p.*, s.name as student_name, s.instruments FROM payments p JOIN students s ON p.student_id = s.id WHERE p.id = ?'
  ).get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  let instruments: string[] = [];
  try { instruments = JSON.parse((row.instruments as string) ?? '[]'); } catch { instruments = []; }
  return { ...row, instruments };
}

export function createPayment(data: Record<string, unknown>) {
  const db = getDb();
  const r = db.prepare(
    'INSERT INTO payments (student_id,amount,month,year,status,due_date,payment_date,paid_at,notes) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(
    data.student_id, data.amount, data.month, data.year, data.status,
    data.due_date ?? null, data.payment_date ?? null, data.paid_at ?? null, data.notes ?? null
  );
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

// ─── Cabinet helpers ──────────────────────────────────────────────────────────

export function getCabinets() {
  return getDb().prepare('SELECT * FROM cabinets ORDER BY name ASC').all();
}

export function getCabinetById(id: number) {
  return getDb().prepare('SELECT * FROM cabinets WHERE id = ?').get(id);
}

export function createCabinet(data: Record<string, unknown>) {
  const db = getDb();
  const r = db.prepare('INSERT INTO cabinets (name,color) VALUES (?,?)')
    .run(data.name, data.color ?? '#6366f1');
  return getCabinetById(r.lastInsertRowid as number);
}

export function updateCabinet(id: number, data: Record<string, unknown>) {
  const db = getDb();
  const { fields, values } = buildUpdate(data, CABINET_FIELDS);
  if (!fields) return getCabinetById(id);
  db.prepare(`UPDATE cabinets SET ${fields} WHERE id = ?`).run(...values, id);
  return getCabinetById(id);
}

export function deleteCabinet(id: number) {
  getDb().prepare('DELETE FROM cabinets WHERE id = ?').run(id);
}

export function getCabinetAssignments(cabinetId?: number) {
  const db = getDb();
  let q = `SELECT a.*, t.name as teacher_name
           FROM cabinet_teacher_assignments a
           LEFT JOIN teachers t ON a.teacher_id = t.id
           WHERE 1=1`;
  const params: unknown[] = [];
  if (cabinetId) { q += ' AND a.cabinet_id = ?'; params.push(cabinetId); }
  return db.prepare(q).all(...params);
}

export function upsertCabinetAssignment(cabinetId: number, dayOfWeek: number, teacherId: number) {
  const db = getDb();
  db.prepare(`
    INSERT INTO cabinet_teacher_assignments (cabinet_id, day_of_week, teacher_id)
    VALUES (?, ?, ?)
    ON CONFLICT(cabinet_id, day_of_week) DO UPDATE SET teacher_id = excluded.teacher_id
  `).run(cabinetId, dayOfWeek, teacherId);
  return db.prepare(
    `SELECT a.*, t.name as teacher_name FROM cabinet_teacher_assignments a
     LEFT JOIN teachers t ON a.teacher_id = t.id
     WHERE a.cabinet_id = ? AND a.day_of_week = ?`
  ).get(cabinetId, dayOfWeek);
}

export function deleteCabinetAssignment(cabinetId: number, dayOfWeek: number) {
  getDb().prepare('DELETE FROM cabinet_teacher_assignments WHERE cabinet_id = ? AND day_of_week = ?').run(cabinetId, dayOfWeek);
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

// ─── Registration helpers ─────────────────────────────────────────────────────

export function getRegistrations(status?: string) {
  const db = getDb();
  let q = 'SELECT * FROM registrations WHERE 1=1';
  const params: unknown[] = [];
  if (status) { q += ' AND status = ?'; params.push(status); }
  q += ' ORDER BY created_at DESC';
  return db.prepare(q).all(...params);
}

export function getRegistrationById(id: number) {
  return getDb().prepare('SELECT * FROM registrations WHERE id = ?').get(id);
}

export function createRegistration(data: Record<string, unknown>) {
  const db = getDb();
  const r = db.prepare(
    'INSERT INTO registrations (name,phone,email,age,course,message,status) VALUES (?,?,?,?,?,?,?)'
  ).run(data.name, data.phone, data.email, data.age ?? null, data.course ?? null, data.message ?? null, 'nou');
  return getRegistrationById(r.lastInsertRowid as number);
}

export function updateRegistrationStatus(id: number, status: string) {
  getDb().prepare('UPDATE registrations SET status = ? WHERE id = ?').run(status, id);
  return getRegistrationById(id);
}

export function deleteRegistration(id: number) {
  getDb().prepare('DELETE FROM registrations WHERE id = ?').run(id);
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
