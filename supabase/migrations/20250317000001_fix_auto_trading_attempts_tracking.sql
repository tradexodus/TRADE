-- Drop the old table structure and recreate it with proper constraints
DROP TABLE IF EXISTS auto_trading_attempts;

-- Create the new auto_trading_attempts table with proper structure
CREATE TABLE IF NOT EXISTS auto_trading_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempts_used INT NOT NULL DEFAULT 1,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
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

-- Create policy for users to update their own attempts
DROP POLICY IF EXISTS "Users can update their own attempts" ON auto_trading_attempts;
CREATE POLICY "Users can update their own attempts"
ON auto_trading_attempts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add to realtime publication
ALTER publication supabase_realtime ADD TABLE auto_trading_attempts;

-- Drop existing function before redefining
DROP FUNCTION IF EXISTS check_and_increment_attempts(uuid, integer);

-- Create improved function to check and increment attempts
CREATE OR REPLACE FUNCTION check_and_increment_attempts(user_id_param UUID, max_attempts_param INT)
RETURNS BOOLEAN AS $$
DECLARE
  current_attempts INT;
  last_reset_time TIMESTAMP WITH TIME ZONE;
  dubai_time TIMESTAMP WITH TIME ZONE := (NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Dubai';
  dubai_date DATE := dubai_time::DATE;
BEGIN
  -- Get or create user's attempts record
  INSERT INTO auto_trading_attempts (user_id, attempts_used, last_reset)
  VALUES (user_id_param, 1, dubai_time)
  ON CONFLICT (user_id) 
  DO NOTHING;
  
  -- Get current attempts and last reset time
  SELECT attempts_used, last_reset INTO current_attempts, last_reset_time
  FROM auto_trading_attempts
  WHERE user_id = user_id_param;
  
  -- Check if we need to reset attempts (if last reset was before today in Dubai time)
  IF DATE(last_reset_time AT TIME ZONE 'Asia/Dubai') < dubai_date THEN
    -- Reset attempts counter to 1 (counting this attempt)
    UPDATE auto_trading_attempts
    SET attempts_used = 1, last_reset = dubai_time
    WHERE user_id = user_id_param;
    
    -- Return true since this is the first attempt of the day
    RETURN TRUE;
  END IF;
  
  -- Check if user has attempts remaining
  IF current_attempts >= max_attempts_param THEN
    -- User has reached their limit
    RETURN FALSE;
  END IF;
  
  -- Increment attempts counter
  UPDATE auto_trading_attempts
  SET attempts_used = attempts_used + 1
  WHERE user_id = user_id_param;
  
  -- User has attempts remaining
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return false
    RAISE NOTICE 'Error in check_and_increment_attempts: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
