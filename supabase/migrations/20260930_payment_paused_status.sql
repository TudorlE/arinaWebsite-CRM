-- Plăți: un abonament pus pe pauză (când elevul mai are alt instrument activ)
-- primește acum un rând cu status 'paused' în loc să dispară din Plăți sau să
-- eșueze silențios la constrângerea veche, care nu cunoștea această valoare.
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('paid', 'unpaid', 'partial', 'overdue', 'paused'));
