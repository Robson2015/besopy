ALTER TABLE tournament_settings
  DROP CONSTRAINT IF EXISTS tournament_settings_qualified_count_check;

UPDATE tournament_settings
SET qualified_count = 4
WHERE qualified_count = 3;

ALTER TABLE tournament_settings
  ADD CONSTRAINT tournament_settings_qualified_count_check
  CHECK (qualified_count IN (2, 4));