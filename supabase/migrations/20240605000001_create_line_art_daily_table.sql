-- Create line_art_daily table to store generated line art
CREATE TABLE IF NOT EXISTS line_art_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  keywords TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE line_art_daily ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to view line art
DROP POLICY IF EXISTS "Public can view line art" ON line_art_daily;
CREATE POLICY "Public can view line art"
  ON line_art_daily
  FOR SELECT
  USING (true);

-- Create policy for service role to manage line art
DROP POLICY IF EXISTS "Service role can manage line art" ON line_art_daily;
CREATE POLICY "Service role can manage line art"
  ON line_art_daily
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Enable realtime (only if not already a member)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'line_art_daily'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE line_art_daily;
  END IF;
END
$$;