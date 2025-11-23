-- Add is_ranked field to battle_matches
-- This allows tracking casual vs ranked matches

ALTER TABLE battle_matches
ADD COLUMN IF NOT EXISTS is_ranked BOOLEAN DEFAULT TRUE;

-- Update matchmaking_queue to track ranked preference
ALTER TABLE matchmaking_queue
ADD COLUMN IF NOT EXISTS is_ranked BOOLEAN DEFAULT TRUE;

-- Add is_ranked to battle_lobbies
ALTER TABLE battle_lobbies
ADD COLUMN IF NOT EXISTS is_ranked BOOLEAN DEFAULT TRUE;

-- Create index for faster ranked/casual filtering
CREATE INDEX IF NOT EXISTS idx_battle_matches_is_ranked ON battle_matches(is_ranked);
