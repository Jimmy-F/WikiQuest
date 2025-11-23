-- Create matchmaking queue table for PvP matchmaking
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mmr INTEGER NOT NULL DEFAULT 1000,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  preferred_race_id TEXT,
  status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'cancelled')),
  is_ranked BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matched_at TIMESTAMPTZ
);

-- Create index for faster matchmaking queries
CREATE INDEX IF NOT EXISTS idx_matchmaking_status_mmr ON matchmaking_queue(status, mmr) WHERE status = 'searching';
CREATE INDEX IF NOT EXISTS idx_matchmaking_user_status ON matchmaking_queue(user_id, status);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_matchmaking_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_matchmaking_queue_updated_at_trigger
  BEFORE UPDATE ON matchmaking_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_matchmaking_queue_updated_at();

-- Cleanup old queue entries (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_old_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM matchmaking_queue
  WHERE created_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Disable RLS for service role
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do anything" ON matchmaking_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
