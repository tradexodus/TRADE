-- Add original_balance column to trading_history table
ALTER TABLE trading_history ADD COLUMN IF NOT EXISTS original_balance NUMERIC DEFAULT NULL;

-- Update historical data to populate original_balance
-- For each trade, we'll set the original_balance to the balance before that trade
-- This is an approximation based on the amount and profit_loss
UPDATE trading_history
SET original_balance = (
  SELECT balance 
  FROM user_accounts 
  WHERE user_accounts.id = trading_history.user_id
) - COALESCE(profit_loss, 0)
WHERE original_balance IS NULL;

-- Enable realtime for the updated table
alter publication supabase_realtime add table trading_history;