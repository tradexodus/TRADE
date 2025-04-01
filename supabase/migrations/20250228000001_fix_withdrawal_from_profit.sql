-- Fix the process_withdrawal_approval function to correctly handle withdrawals from profit
CREATE OR REPLACE FUNCTION process_withdrawal_approval(withdrawal_id UUID) RETURNS BOOLEAN
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
    RAISE EXCEPTION 'Withdrawal not found or not in pending status';
  END IF;
  
  -- Get the user account
  SELECT * INTO user_account FROM user_accounts WHERE id = withdrawal_record.user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User account not found';
  END IF;
  
  -- Check if user has sufficient funds based on withdrawal source
  IF withdrawal_record.from_profit > 0 THEN
    -- Withdrawing from profit
    IF user_account.profit < withdrawal_record.from_profit THEN
      RAISE EXCEPTION 'Insufficient profit balance';
    END IF;
    
    -- Update user account - deduct from profit
    UPDATE user_accounts
    SET profit = profit - withdrawal_record.from_profit
    WHERE id = withdrawal_record.user_id;
  ELSIF withdrawal_record.from_balance > 0 THEN
    -- Withdrawing from balance
    IF user_account.balance < withdrawal_record.from_balance THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Update user account - deduct from balance
    UPDATE user_accounts
    SET balance = balance - withdrawal_record.from_balance
    WHERE id = withdrawal_record.user_id;
  ELSE
    RAISE EXCEPTION 'Invalid withdrawal amount';
  END IF;
  
  -- Update withdrawal status to approved
  UPDATE withdrawals
  SET status = 'approved'
  WHERE id = withdrawal_id;
  
  RETURN TRUE;
END;
$;