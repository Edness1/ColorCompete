-- Add art_style column to line_art_daily table if it doesn't exist
ALTER TABLE line_art_daily ADD COLUMN IF NOT EXISTS art_style TEXT DEFAULT 'standard';