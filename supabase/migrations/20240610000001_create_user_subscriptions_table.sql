-- Create user_subscriptions table to track subscription tiers and remaining submissions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  remaining_submissions INTEGER NOT NULL DEFAULT 2,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Enable row-level security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own subscription data" ON user_subscriptions;
CREATE POLICY "Users can view their own subscription data"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription data" ON user_subscriptions;
CREATE POLICY "Users can update their own subscription data"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Add to realtime (only if not already a member)
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'user_subscriptions'
  ) THEN
    alter publication supabase_realtime add table user_subscriptions;
  END IF;
END
$;