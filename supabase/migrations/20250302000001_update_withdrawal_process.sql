-- Create a function to process withdrawal approvals if it doesn't exist
CREATE OR REPLACE FUNCTION process_withdrawal_approval(withdrawal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  withdrawal_record RECORD;
  user_account RECORD;
  new_balance DECIMAL;
  new_profit DECIMAL;
BEGIN
  -- Get the withdrawal record
  SELECT * INTO withdrawal_record FROM withdrawals WHERE id = withdrawal_id;
  
  IF withdrawal_record IS NULL THEN
    RAISE EXCEPTION 'Withdrawal record not found';
  END IF;
  
  IF withdrawal_record.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal is not in pending status';
  END IF;
  
  -- Get the user account
  SELECT * INTO user_account FROM user_accounts WHERE id = withdrawal_record.user_id;
  
  IF user_account IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;
  
  -- Calculate new balances
  new_balance := user_account.balance - withdrawal_record.from_balance;
  new_profit := user_account.profit - withdrawal_record.from_profit;
  
  -- Check if user has sufficient funds
  IF new_balance < 0 OR new_profit < 0 THEN
    RAISE EXCEPTION 'Insufficient funds for withdrawal';
  END IF;
  
  -- Update user account
  UPDATE user_accounts
  SET 
    balance = new_balance,
    profit = new_profit
  WHERE id = withdrawal_record.user_id;
  
  -- Update withdrawal status
  UPDATE withdrawals
  SET status = 'approved'
  WHERE id = withdrawal_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Withdrawal approved successfully',
    'new_balance', new_balance,
    'new_profit', new_profit
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_withdrawal_approval TO authenticated;

-- Add the function to the publication if it's not already a member
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'withdrawals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE withdrawals;
  END IF;
END
$$;
