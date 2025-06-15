-- Add bw_image_url column to line_art_daily table if it doesn't exist
ALTER TABLE line_art_daily ADD COLUMN IF NOT EXISTS bw_image_url TEXT;