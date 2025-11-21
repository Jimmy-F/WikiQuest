-- Add best_medal column to track highest achievement per race
-- This prevents XP farming by completing same race multiple times with better medals

ALTER TABLE race_first_completions
  ADD COLUMN IF NOT EXISTS best_medal TEXT DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS best_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_time INTEGER DEFAULT 999999;

-- Add constraint to ensure valid medal values
ALTER TABLE race_first_completions
  ADD CONSTRAINT check_best_medal
  CHECK (best_medal IN ('bronze', 'silver', 'gold'));

-- Update comment
COMMENT ON TABLE race_first_completions IS
  'Tracks best completion (medal, score, time) per race to prevent XP farming by medal upgrades';

COMMENT ON COLUMN race_first_completions.best_medal IS
  'Highest medal achieved (bronze, silver, gold) - only award XP for improvements';

COMMENT ON COLUMN race_first_completions.best_score IS
  'Best score achieved on this race';

COMMENT ON COLUMN race_first_completions.best_time IS
  'Fastest completion time in seconds';
