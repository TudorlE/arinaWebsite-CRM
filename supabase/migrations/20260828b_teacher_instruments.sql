-- Profesori: ce discipline predă fiecare profesor (afișat/editabil în popup-ul de adăugare).
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS instruments text[] DEFAULT '{}';
