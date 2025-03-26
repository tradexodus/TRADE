-- Ensure profit column exists and has correct default
ALTER TABLE user_accounts ALTER COLUMN profit SET DEFAULT 0;

-- Add comment to explain the purpose of the profit column
COMMENT ON COLUMN user_accounts.profit IS 'Tracks the cumulative profit/loss from all trades';
