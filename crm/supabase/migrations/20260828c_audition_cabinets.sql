-- Audiții: reuse the same cabinets as Program Privat so the audition
-- calendar can use the identical Ora × Cabinet grid.
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES cabinets(id) ON DELETE SET NULL;
