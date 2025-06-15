-- Ensure the contests table exists before referencing it
-- We don't recreate it here as it should be created by the previous migration
-- This is just a safety check
DO $ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'contests') THEN
    RAISE EXCEPTION 'The contests table does not exist. Please run the create_contests_table migration first.';
  END IF;
END $;

-- Create contest_analytics table to track contest metrics
CREATE TABLE IF NOT EXISTS contest_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID REFERENCES contests(id) NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  submissions INTEGER NOT NULL DEFAULT 0,
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE contest_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage analytics
DROP POLICY IF EXISTS "Admins can manage contest analytics" ON contest_analytics;
CREATE POLICY "Admins can manage contest analytics"
  ON contest_analytics
  USING (auth.uid() IN (
    SELECT user_id FROM admin_users
  ));

-- Create policy for public to view analytics
DROP POLICY IF EXISTS "Public can view contest analytics" ON contest_analytics;
CREATE POLICY "Public can view contest analytics"
  ON contest_analytics
  FOR SELECT
  USING (true);

-- Create function to initialize analytics when a contest is created
CREATE OR REPLACE FUNCTION initialize_contest_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contest_analytics (contest_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize analytics when a contest is created
DROP TRIGGER IF EXISTS initialize_contest_analytics_trigger ON contests;
CREATE TRIGGER initialize_contest_analytics_trigger
AFTER INSERT ON contests
FOR EACH ROW
EXECUTE FUNCTION initialize_contest_analytics();

-- Create function to increment contest analytics
CREATE OR REPLACE FUNCTION increment_contest_analytics(contest_id UUID, metric TEXT)
RETURNS VOID AS $$
BEGIN
  IF metric = 'views' THEN
    UPDATE contest_analytics SET views = views + 1, updated_at = NOW() WHERE contest_id = $1;
  ELSIF metric = 'downloads' THEN
    UPDATE contest_analytics SET downloads = downloads + 1, updated_at = NOW() WHERE contest_id = $1;
  ELSIF metric = 'submissions' THEN
    UPDATE contest_analytics SET submissions = submissions + 1, updated_at = NOW() WHERE contest_id = $1;
  ELSIF metric = 'votes' THEN
    UPDATE contest_analytics SET votes = votes + 1, updated_at = NOW() WHERE contest_id = $1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update submission count when a submission is added
CREATE OR REPLACE FUNCTION update_contest_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contest_id IS NOT NULL THEN
    PERFORM increment_contest_analytics(NEW.contest_id, 'submissions');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update submission count
DROP TRIGGER IF EXISTS update_contest_submission_count_trigger ON submissions;
CREATE TRIGGER update_contest_submission_count_trigger
AFTER INSERT ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_contest_submission_count();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE contest_analytics;
