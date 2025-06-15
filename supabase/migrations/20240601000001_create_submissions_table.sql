-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  file_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  age_group TEXT NOT NULL,
  contest_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own submissions
DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
CREATE POLICY "Users can view their own submissions"
  ON submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own submissions
DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;
CREATE POLICY "Users can insert their own submissions"
  ON submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for public access to approved submissions
DROP POLICY IF EXISTS "Public can view approved submissions" ON submissions;
CREATE POLICY "Public can view approved submissions"
  ON submissions
  FOR SELECT
  USING (status = 'approved');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;

-- Create storage bucket for artwork
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork', 'artwork', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy for authenticated uploads
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'artwork' AND auth.uid() IS NOT NULL);

-- Set up storage policy for public downloads
DROP POLICY IF EXISTS "Public can download files" ON storage.objects;
CREATE POLICY "Public can download files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'artwork');
