-- Create auto_trading_attempts table to track daily attempts
CREATE TABLE IF NOT EXISTS auto_trading_attempts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    attempts_used INT NOT NULL DEFAULT 0,
    last_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add publication for realtime
ALTER publication supabase_realtime ADD TABLE auto_trading_attempts;

-- Function to check if a user has exceeded their daily attempts limit
-- Returns true if they can make another attempt, false if they've reached their limit
CREATE OR REPLACE FUNCTION check_and_increment_attempts(
    user_id UUID,
    max_attempts INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_attempts INT;
    last_reset_time TIMESTAMP WITH TIME ZONE;
    dubai_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current time in Dubai timezone (GMT+4)
    dubai_time := (NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Dubai';
    
    -- Get or create user's attempts record
    INSERT INTO auto_trading_attempts (user_id, attempts_used, last_reset)
    VALUES (user_id, 0, dubai_time)
    ON CONFLICT (user_id) 
    DO NOTHING;
    
    -- Get current attempts and last reset time
    SELECT attempts_used, last_reset INTO current_attempts, last_reset_time
    FROM auto_trading_attempts
    WHERE auto_trading_attempts.user_id = check_and_increment_attempts.user_id;
    
    -- Check if we need to reset attempts (if last reset was before today in Dubai time)
    IF DATE(last_reset_time AT TIME ZONE 'Asia/Dubai') < DATE(dubai_time) THEN
        -- Reset attempts counter
        UPDATE auto_trading_attempts
        SET attempts_used = 0, last_reset = dubai_time
        WHERE auto_trading_attempts.user_id = check_and_increment_attempts.user_id;
        
        current_attempts := 0;
    END IF;
    
    -- Check if user has attempts remaining
    IF current_attempts >= max_attempts THEN
        -- User has reached their limit
        RETURN FALSE;
    END IF;
    
    -- Increment attempts counter
    UPDATE auto_trading_attempts
    SET attempts_used = attempts_used + 1
    WHERE auto_trading_attempts.user_id = check_and_increment_attempts.user_id;
    
    -- User has attempts remaining
    RETURN TRUE;
END;
$$;

-- Function to reset all users' attempts at midnight Dubai time
CREATE OR REPLACE FUNCTION reset_daily_attempts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    dubai_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current time in Dubai timezone (GMT+4)
    dubai_time := (NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Dubai';
    
    -- Reset attempts for all users if it's a new day in Dubai time
    UPDATE auto_trading_attempts
    SET attempts_used = 0, last_reset = dubai_time
    WHERE DATE(last_reset AT TIME ZONE 'Asia/Dubai') < DATE(dubai_time);
END;
$$;
