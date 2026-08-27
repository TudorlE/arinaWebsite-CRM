-- Fix: auto-increment sequences drifted behind real MAX(id) (likely from seed
-- data inserted with explicit ids), causing intermittent "duplicate key value
-- violates unique constraint" on insert. Safe to run any time, idempotent.
select setval(pg_get_serial_sequence('teachers', 'id'), coalesce((select max(id) from teachers), 1));
select setval(pg_get_serial_sequence('students', 'id'), coalesce((select max(id) from students), 1));
select setval(pg_get_serial_sequence('lessons', 'id'), coalesce((select max(id) from lessons), 1));
select setval(pg_get_serial_sequence('payments', 'id'), coalesce((select max(id) from payments), 1));
select setval(pg_get_serial_sequence('student_notes', 'id'), coalesce((select max(id) from student_notes), 1));
select setval(pg_get_serial_sequence('events', 'id'), coalesce((select max(id) from events), 1));
select setval(pg_get_serial_sequence('cabinets', 'id'), coalesce((select max(id) from cabinets), 1));
select setval(pg_get_serial_sequence('cabinet_teacher_assignments', 'id'), coalesce((select max(id) from cabinet_teacher_assignments), 1));
select setval(pg_get_serial_sequence('registrations', 'id'), coalesce((select max(id) from registrations), 1));
select setval(pg_get_serial_sequence('recurring_schedules', 'id'), coalesce((select max(id) from recurring_schedules), 1));
select setval(pg_get_serial_sequence('attendance', 'id'), coalesce((select max(id) from attendance), 1));
select setval(pg_get_serial_sequence('auditions', 'id'), coalesce((select max(id) from auditions), 1));
select setval(pg_get_serial_sequence('cabinet_day_status', 'id'), coalesce((select max(id) from cabinet_day_status), 1));
