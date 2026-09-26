-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id BIGSERIAL PRIMARY KEY,
  poule_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  home_team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  stage TEXT NOT NULL, -- 'poules', '16eme', '8eme', 'quart', 'demi', 'finale'
  match_date DATE,
  home_score INTEGER,
  away_score INTEGER,
  home_yellow_cards INTEGER NOT NULL DEFAULT 0,
  home_red_cards INTEGER NOT NULL DEFAULT 0,
  away_yellow_cards INTEGER NOT NULL DEFAULT 0,
  away_red_cards INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_date DATE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_yellow_cards INTEGER NOT NULL DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_red_cards INTEGER NOT NULL DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_yellow_cards INTEGER NOT NULL DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_red_cards INTEGER NOT NULL DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS teams_poule_id_idx ON teams(poule_id);
CREATE INDEX IF NOT EXISTS teams_user_id_idx ON teams(user_id);
CREATE INDEX IF NOT EXISTS matches_stage_idx ON matches(stage);
CREATE INDEX IF NOT EXISTS matches_home_team_id_idx ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS matches_away_team_id_idx ON matches(away_team_id);

-- Shared tournament display settings
CREATE TABLE IF NOT EXISTS tournament_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  qualified_count INTEGER NOT NULL DEFAULT 4 CHECK (qualified_count IN (2, 3, 4)),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_settings ENABLE ROW LEVEL SECURITY;

-- Make the script safe to run again in the same Supabase project
DROP POLICY IF EXISTS "Public can view tournament teams" ON teams;
DROP POLICY IF EXISTS "Users can view their own teams" ON teams;
DROP POLICY IF EXISTS "Users can insert their own teams" ON teams;
DROP POLICY IF EXISTS "Users can update their own teams" ON teams;
DROP POLICY IF EXISTS "Users can delete their own teams" ON teams;
DROP POLICY IF EXISTS "Users can view all matches" ON matches;
DROP POLICY IF EXISTS "Users can insert matches" ON matches;
DROP POLICY IF EXISTS "Users can update matches" ON matches;
DROP POLICY IF EXISTS "Users can delete matches" ON matches;

DROP POLICY IF EXISTS "Public can view tournament settings" ON tournament_settings;
DROP POLICY IF EXISTS "Authenticated users can manage tournament settings" ON tournament_settings;

CREATE POLICY "Public can view tournament settings" ON tournament_settings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage tournament settings" ON tournament_settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for teams
CREATE POLICY "Public can view tournament teams" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own teams" ON teams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own teams" ON teams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teams" ON teams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own teams" ON teams
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for matches
CREATE POLICY "Users can view all matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Users can insert matches" ON matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = matches.home_team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update matches" ON matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = matches.home_team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete matches" ON matches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = matches.home_team_id
      AND teams.user_id = auth.uid()
    )
  );
