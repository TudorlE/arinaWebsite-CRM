-- Plăți: "notes" era folosit atât pentru comentariul liber al adminului
-- (ex. "a plătit cash"), cât și pentru linia de credit auto-generată
-- ("Credit 2 lecții × 450 = −900 MDL ...") — editarea unuia îl ștergea pe
-- celălalt. Le separăm: "notes" rămâne exclusiv recalculul sistemului,
-- "comment" e exclusiv textul liber al adminului.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS comment text;
