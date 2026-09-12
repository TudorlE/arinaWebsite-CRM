-- Plăți: reține pentru ce instrument/serviciu e plata, plus detaliile abonamentului
-- (plan vechi/nou, nr. lecții, preț per lecție) folosite deja la calculul sumei
-- din PaymentForm, dar care până acum nu erau persistate nicăieri.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS service text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_type text CHECK (plan_type IN ('old', 'new'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS lesson_count integer CHECK (lesson_count IN (4, 8, 12));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS price_per_lesson numeric(10,2);
