-- Battle System Tables
-- Creates async PvP battle functionality with MMR, bots, and matchmaking

-- Player Battle Stats
CREATE TABLE IF NOT EXISTS battle_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mmr INTEGER DEFAULT 1000,
  tier TEXT DEFAULT 'Apprentice',
  total_battles INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  last_battle_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Battle Matches
CREATE TABLE IF NOT EXISTS battle_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type TEXT NOT NULL DEFAULT 'async', -- 'async' or 'real_time'
  race_id TEXT NOT NULL,
  start_article TEXT NOT NULL,
  end_article TEXT NOT NULL,
  difficulty TEXT NOT NULL,

  -- Player 1 (creator/challenger)
  player1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player1_mmr INTEGER,
  player1_time INTEGER, -- seconds
  player1_clicks INTEGER,
  player1_path TEXT[], -- array of article titles
  player1_completed_at TIMESTAMPTZ,

  -- Player 2 (opponent/challengee)
  player2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player2_mmr INTEGER,
  player2_time INTEGER,
  player2_clicks INTEGER,
  player2_path TEXT[],
  player2_completed_at TIMESTAMPTZ,
  player2_is_bot BOOLEAN DEFAULT FALSE,
  player2_bot_difficulty TEXT, -- 'easy', 'medium', 'hard'

  -- Results
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_draw BOOLEAN DEFAULT FALSE,

  -- MMR changes
  player1_mmr_change INTEGER,
  player2_mmr_change INTEGER,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'abandoned'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'abandoned')),
  CONSTRAINT valid_match_type CHECK (match_type IN ('async', 'real_time')),
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  CONSTRAINT valid_bot_difficulty CHECK (player2_bot_difficulty IS NULL OR player2_bot_difficulty IN ('easy', 'medium', 'hard', 'expert', 'master'))
);

-- Matchmaking Queue
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mmr INTEGER NOT NULL,
  race_difficulty TEXT, -- preferred difficulty
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes',

  CONSTRAINT valid_difficulty CHECK (race_difficulty IS NULL OR race_difficulty IN ('easy', 'medium', 'hard', 'expert'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_battle_stats_mmr ON battle_stats(mmr DESC);
CREATE INDEX IF NOT EXISTS idx_battle_stats_tier ON battle_stats(tier);
CREATE INDEX IF NOT EXISTS idx_battle_stats_user ON battle_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_battle_matches_status ON battle_matches(status);
CREATE INDEX IF NOT EXISTS idx_battle_matches_player1 ON battle_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_battle_matches_player2 ON battle_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_battle_matches_created ON battle_matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battle_matches_completed ON battle_matches(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_mmr ON matchmaking_queue(mmr);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_user ON matchmaking_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_expires ON matchmaking_queue(expires_at);

-- Function to automatically create battle_stats for new users
CREATE OR REPLACE FUNCTION create_battle_stats_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO battle_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create battle_stats
DROP TRIGGER IF EXISTS create_battle_stats_trigger ON users;
CREATE TRIGGER create_battle_stats_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_battle_stats_for_user();

-- Function to update MMR tier based on MMR value
CREATE OR REPLACE FUNCTION update_mmr_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tier := CASE
    WHEN NEW.mmr < 500 THEN 'Novice'
    WHEN NEW.mmr < 1000 THEN 'Apprentice'
    WHEN NEW.mmr < 1500 THEN 'Scholar'
    WHEN NEW.mmr < 2000 THEN 'Expert'
    WHEN NEW.mmr < 2500 THEN 'Master'
    ELSE 'Legend'
  END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update tier
DROP TRIGGER IF EXISTS update_tier_trigger ON battle_stats;
CREATE TRIGGER update_tier_trigger
  BEFORE UPDATE OF mmr ON battle_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_mmr_tier();

-- Function to clean up expired matchmaking queue entries
CREATE OR REPLACE FUNCTION cleanup_expired_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM matchmaking_queue
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE battle_stats IS 'Tracks player battle statistics and MMR ratings';
COMMENT ON TABLE battle_matches IS 'Records all battle matches between players or bots';
COMMENT ON TABLE matchmaking_queue IS 'Temporary queue for finding battle opponents';

COMMENT ON COLUMN battle_stats.mmr IS 'Matchmaking Rating (Elo-style) - starts at 1000';
COMMENT ON COLUMN battle_stats.tier IS 'Player tier based on MMR (Novice, Apprentice, Scholar, Expert, Master, Legend)';
COMMENT ON COLUMN battle_matches.player2_is_bot IS 'True if player2 is a bot opponent';
COMMENT ON COLUMN battle_matches.player2_bot_difficulty IS 'Bot difficulty level if player2 is a bot';

-- Initialize battle_stats for existing users
INSERT INTO battle_stats (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
