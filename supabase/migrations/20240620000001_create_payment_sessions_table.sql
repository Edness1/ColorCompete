-- Create payment_sessions table to track Stripe payment sessions
CREATE TABLE IF NOT EXISTS payment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  payment_type TEXT NOT NULL,
  amount INTEGER,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT payment_sessions_status_check CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Create function to add a one-time submission credit
CREATE OR REPLACE FUNCTION add_one_time_submission_credit(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if user exists in user_subscriptions
  IF EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = $1) THEN
    -- Update existing record
    UPDATE user_subscriptions
    SET remaining_submissions = remaining_submissions + 1,
        updated_at = now()
    WHERE user_id = $1;
  ELSE
    -- Create new record with default free tier + 1 extra submission
    INSERT INTO user_subscriptions (
      user_id,
      tier,
      remaining_submissions,
      month,
      year
    ) VALUES (
      $1,
      'free',
      3, -- Default free tier (2) + 1 extra submission
      EXTRACT(MONTH FROM now()),
      EXTRACT(YEAR FROM now())
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for payment_sessions (only if not already a member)
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'payment_sessions'
  ) THEN
    alter publication supabase_realtime add table payment_sessions;
  END IF;
END$;
