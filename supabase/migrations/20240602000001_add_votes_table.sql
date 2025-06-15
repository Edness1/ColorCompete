-- Create votes table to track user votes on submissions
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  submission_id UUID REFERENCES submissions(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, submission_id)
);

-- Enable row level security
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own votes
DROP POLICY IF EXISTS "Users can view their own votes" ON votes;
CREATE POLICY "Users can view their own votes"
  ON votes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own votes
DROP POLICY IF EXISTS "Users can insert their own votes" ON votes;
CREATE POLICY "Users can insert their own votes"
  ON votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own votes
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;
CREATE POLICY "Users can delete their own votes"
  ON votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update submission vote count when votes are added or removed
CREATE OR REPLACE FUNCTION update_submission_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE submissions
    SET votes = votes + 1
    WHERE id = NEW.submission_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE submissions
    SET votes = votes - 1
    WHERE id = OLD.submission_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update submission vote count
DROP TRIGGER IF EXISTS votes_insert_trigger ON votes;
CREATE TRIGGER votes_insert_trigger
AFTER INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION update_submission_votes();

DROP TRIGGER IF EXISTS votes_delete_trigger ON votes;
CREATE TRIGGER votes_delete_trigger
AFTER DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_submission_votes();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
