ALTER TABLE tournament_settings ADD COLUMN IF NOT EXISTS poule_terrains JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'tournament_settings'
    ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_settings';
  END IF;
END $$;