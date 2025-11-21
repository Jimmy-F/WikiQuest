-- Add is_custom column to wiki_races table
ALTER TABLE wiki_races ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;

-- Create index for filtering custom vs official races
CREATE INDEX IF NOT EXISTS idx_wiki_races_is_custom ON wiki_races(is_custom);
