-- Battle Lobbies System
-- Supports: Direct Invites, Public Lobbies, and Matchmaking

-- Battle Lobbies Table
CREATE TABLE IF NOT EXISTS battle_lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_code TEXT UNIQUE NOT NULL,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id TEXT NOT NULL,
  start_article TEXT NOT NULL,
  end_article TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  max_players INTEGER DEFAULT 2,
  status TEXT DEFAULT 'waiting', -- waiting/ready/in_progress/completed/cancelled
  battle_match_id UUID REFERENCES battle_matches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  completed_at TIMESTAMPTZ
);

-- Lobby Participants Table
CREATE TABLE IF NOT EXISTS lobby_participants (
  lobby_id UUID NOT NULL REFERENCES battle_lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'joined', -- joined/ready/racing/finished
  is_host BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  ready_at TIMESTAMPTZ,
  PRIMARY KEY (lobby_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON battle_lobbies(status);
CREATE INDEX IF NOT EXISTS idx_lobbies_public ON battle_lobbies(is_public) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_lobbies_code ON battle_lobbies(lobby_code);
CREATE INDEX IF NOT EXISTS idx_lobbies_expires ON battle_lobbies(expires_at);
CREATE INDEX IF NOT EXISTS idx_lobby_participants_user ON lobby_participants(user_id);

-- Function to generate unique lobby code
CREATE OR REPLACE FUNCTION generate_lobby_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes confusing chars
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate lobby code
CREATE OR REPLACE FUNCTION set_lobby_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lobby_code IS NULL OR NEW.lobby_code = '' THEN
    LOOP
      NEW.lobby_code := generate_lobby_code();
      -- Check if code already exists
      IF NOT EXISTS (SELECT 1 FROM battle_lobbies WHERE lobby_code = NEW.lobby_code) THEN
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_lobby_code
  BEFORE INSERT ON battle_lobbies
  FOR EACH ROW
  EXECUTE FUNCTION set_lobby_code();

-- Update matchmaking_queue table if it doesn't have all needed columns
ALTER TABLE matchmaking_queue
  ADD COLUMN IF NOT EXISTS preferred_race_id TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- Function to cleanup expired lobbies
CREATE OR REPLACE FUNCTION cleanup_expired_lobbies()
RETURNS void AS $$
BEGIN
  UPDATE battle_lobbies
  SET status = 'cancelled'
  WHERE status = 'waiting'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON battle_lobbies TO authenticated;
GRANT ALL ON lobby_participants TO authenticated;
