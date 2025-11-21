-- Create wiki_races table for tracking wiki race games
CREATE TABLE IF NOT EXISTS wiki_races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  race_id TEXT NOT NULL,
  start_article TEXT NOT NULL,
  end_article TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  optimal_path INTEGER NOT NULL DEFAULT 5,
  article_path TEXT[] DEFAULT ARRAY[]::TEXT[],
  clicks_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_seconds INTEGER,
  score INTEGER,
  medal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_wiki_races_user_id ON wiki_races(user_id);
CREATE INDEX idx_wiki_races_race_id ON wiki_races(race_id);
CREATE INDEX idx_wiki_races_completed ON wiki_races(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_wiki_races_score ON wiki_races(score DESC NULLS LAST);

-- Add XP transaction support for wiki races
ALTER TABLE xp_transactions ADD COLUMN IF NOT EXISTS wiki_race_id UUID REFERENCES wiki_races(id);
