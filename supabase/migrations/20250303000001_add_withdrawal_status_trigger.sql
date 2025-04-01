-- Create a function to handle withdrawal status changes
CREATE OR REPLACE FUNCTION handle_withdrawal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If the status is changed to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update user account balances
    UPDATE user_accounts
    SET 
      balance = balance - NEW.from_balance,
      profit = profit - NEW.from_profit
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS withdrawal_status_change_trigger ON withdrawals;

-- Create the trigger
CREATE TRIGGER withdrawal_status_change_trigger
AFTER UPDATE OF status ON withdrawals
FOR EACH ROW
EXECUTE FUNCTION handle_withdrawal_status_change();
