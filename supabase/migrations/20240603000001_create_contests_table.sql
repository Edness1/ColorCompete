-- Create contests table to manage daily contests
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  contest_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to view active contests
DROP POLICY IF EXISTS "Public can view active contests" ON contests;
CREATE POLICY "Public can view active contests"
  ON contests
  FOR SELECT
  USING (status = 'active' OR status = 'completed');

-- Create policy for admins to manage contests
DROP POLICY IF EXISTS "Admins can manage contests" ON contests;
CREATE POLICY "Admins can manage contests"
  ON contests
  USING (auth.uid() IN (
    SELECT user_id FROM admin_users
  ));

-- Create admin_users table to track admin privileges
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add relationship between submissions and contests
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS contest_id UUID REFERENCES contests(id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE contests;
