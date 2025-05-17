-- Check if auto_trading_attempts table exists, if not create it
CREATE TABLE IF NOT EXISTS auto_trading_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, attempt_date)
);

-- Enable row level security
ALTER TABLE auto_trading_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert their own attempts
DROP POLICY IF EXISTS "Users can insert their own attempts" ON auto_trading_attempts;
CREATE POLICY "Users can insert their own attempts"
ON auto_trading_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to view their own attempts
DROP POLICY IF EXISTS "Users can view their own attempts" ON auto_trading_attempts;
CREATE POLICY "Users can view their own attempts"
ON auto_trading_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Table is already part of realtime publication

-- Drop existing function before redefining with different parameter names
DROP FUNCTION IF EXISTS check_and_increment_attempts(uuid, integer);

-- Create or replace function to check and increment attempts
CREATE OR REPLACE FUNCTION check_and_increment_attempts(user_id_param UUID, max_attempts_param INT)
RETURNS BOOLEAN AS $$
DECLARE
  current_attempts INT;
  today_date DATE := (NOW() AT TIME ZONE 'UTC+4')::DATE; -- Dubai time (GMT+4)
BEGIN
  -- Get current attempts count for today
  SELECT COUNT(*) INTO current_attempts
  FROM auto_trading_attempts
  WHERE user_id = user_id_param AND attempt_date = today_date;
  
  -- Check if user has exceeded their daily limit
  IF current_attempts >= max_attempts_param THEN
    RETURN FALSE;
  END IF;
  
  -- Insert new attempt
  INSERT INTO auto_trading_attempts (user_id, attempt_date)
  VALUES (user_id_param, today_date);
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle case where record already exists (shouldn't happen with our logic)
    RETURN FALSE;
  WHEN OTHERS THEN
    -- Log error and return false
    RAISE NOTICE 'Error in check_and_increment_attempts: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to reset daily attempts
CREATE OR REPLACE FUNCTION reset_daily_attempts()
RETURNS VOID AS $$
DECLARE
  yesterday_date DATE := ((NOW() AT TIME ZONE 'UTC+4') - INTERVAL '1 day')::DATE;
BEGIN
  -- Delete attempts older than yesterday
  DELETE FROM auto_trading_attempts
  WHERE attempt_date < yesterday_date;
  
  RAISE NOTICE 'Daily attempts reset completed';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in reset_daily_attempts: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
