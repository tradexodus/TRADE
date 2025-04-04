-- Create a function to handle deposit status changes
CREATE OR REPLACE FUNCTION handle_deposit_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Update user account balance
    UPDATE user_accounts
    SET balance = balance + NEW.amount
    WHERE id = NEW.user_id;
    
    -- Get current total deposit amount
    DECLARE current_total DECIMAL;
    SELECT COALESCE(total_deposit_amount, 0) INTO current_total
    FROM user_profiles
    WHERE id = NEW.user_id;
    
    -- Update user profile with new total deposit amount
    -- Note: The neuron level will be calculated in the application code
    UPDATE user_profiles
    SET total_deposit_amount = COALESCE(total_deposit_amount, 0) + NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when deposit status changes
DROP TRIGGER IF EXISTS on_deposit_status_change ON deposits;
CREATE TRIGGER on_deposit_status_change
  AFTER UPDATE OF status ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION handle_deposit_status_change();

-- Enable row-level security on deposits table
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Create policies for deposits table
DROP POLICY IF EXISTS "Users can view their own deposits" ON deposits;
CREATE POLICY "Users can view their own deposits"
  ON deposits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own deposits" ON deposits;
CREATE POLICY "Users can insert their own deposits"
  ON deposits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add deposits table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE deposits;