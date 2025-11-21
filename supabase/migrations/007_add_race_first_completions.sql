-- Track first-time race completions for XP awards
-- This prevents users from farming XP by repeating the same race

CREATE TABLE IF NOT EXISTS race_first_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Ensure each user can only have one first completion per race
  UNIQUE(user_id, race_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_race_first_completions_user_race
  ON race_first_completions(user_id, race_id);

-- Enable RLS
ALTER TABLE race_first_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own first completions"
  ON race_first_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage first completions"
  ON race_first_completions FOR ALL
  USING (true);

-- Comment
COMMENT ON TABLE race_first_completions IS 'Tracks first-time race completions to prevent XP farming';
