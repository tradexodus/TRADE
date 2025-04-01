-- Create a function to process withdrawal approvals
CREATE OR REPLACE FUNCTION process_withdrawal_approval(withdrawal_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  withdrawal_record RECORD;
  user_account RECORD;
BEGIN
  -- Get the withdrawal record
  SELECT * INTO withdrawal_record FROM withdrawals WHERE id = withdrawal_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found or already processed';
  END IF;
  
  -- Get the user account
  SELECT * INTO user_account FROM user_accounts WHERE id = withdrawal_record.user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User account not found';
  END IF;
  
  -- Check if there's enough balance/profit
  IF withdrawal_record.from_profit > 0 AND user_account.profit < withdrawal_record.from_profit THEN
    RAISE EXCEPTION 'Insufficient profit balance';
  END IF;
  
  IF withdrawal_record.from_balance > 0 AND user_account.balance < withdrawal_record.from_balance THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Update the user account
  UPDATE user_accounts
  SET 
    balance = CASE 
      WHEN withdrawal_record.from_balance > 0 THEN balance - withdrawal_record.from_balance
      ELSE balance
    END,
    profit = CASE 
      WHEN withdrawal_record.from_profit > 0 THEN profit - withdrawal_record.from_profit
      ELSE profit
    END
  WHERE id = withdrawal_record.user_id;
  
  -- Update the withdrawal status
  UPDATE withdrawals
  SET status = 'approved'
  WHERE id = withdrawal_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Update the withdrawal status to failed if there's an error
    UPDATE withdrawals
    SET status = 'failed', 
        notes = SQLERRM
    WHERE id = withdrawal_id;
    
    RETURN FALSE;
END;
$$;

-- Add notes column to withdrawals table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'withdrawals' AND column_name = 'notes') THEN
    ALTER TABLE withdrawals ADD COLUMN notes TEXT;
  END IF;
END
$$;

-- Enable RLS on withdrawals table
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policies for withdrawals table
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawals;
CREATE POLICY "Users can view their own withdrawals"
  ON withdrawals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own withdrawals" ON withdrawals;
CREATE POLICY "Users can insert their own withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add the table to realtime publication if not already added
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'withdrawals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE withdrawals;
  END IF;
END
$do$;
