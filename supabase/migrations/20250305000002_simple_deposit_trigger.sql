-- Create a function to handle deposit approvals
CREATE OR REPLACE FUNCTION handle_deposit_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles total_deposit_amount and neuron level only
  -- Balance is NOT updated automatically - will be done manually
  UPDATE user_profiles
  SET 
    total_deposit_amount = COALESCE(total_deposit_amount, 0) + NEW.amount,
    neuron_level = (
      SELECT name FROM (
        VALUES
          ('Beginner', 0, 200, 2.5),
          ('Intermediate', 201, 1000, 3),
          ('Advanced', 1001, 5000, 4),
          ('Pro', 5001, 10000, 5),
          ('VIP', 10001, 50000, 7),
          ('Elite', 50001, NULL, 13.4)
      ) AS levels(name, min_amount, max_amount, percentage)
      WHERE 
        COALESCE(total_deposit_amount, 0) + NEW.amount >= min_amount AND
        (max_amount IS NULL OR COALESCE(total_deposit_amount, 0) + NEW.amount <= max_amount)
      ORDER BY min_amount DESC
      LIMIT 1
    ),
    neuron_level_percentage = (
      SELECT percentage FROM (
        VALUES
          ('Beginner', 0, 200, 2.5),
          ('Intermediate', 201, 1000, 3),
          ('Advanced', 1001, 5000, 4),
          ('Pro', 5001, 10000, 5),
          ('VIP', 10001, 50000, 7),
          ('Elite', 50001, NULL, 13.4)
      ) AS levels(name, min_amount, max_amount, percentage)
      WHERE 
        COALESCE(total_deposit_amount, 0) + NEW.amount >= min_amount AND
        (max_amount IS NULL OR COALESCE(total_deposit_amount, 0) + NEW.amount <= max_amount)
      ORDER BY min_amount DESC
      LIMIT 1
    )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS deposit_approval_trigger ON deposits;

-- Create the trigger
CREATE TRIGGER deposit_approval_trigger
AFTER UPDATE OF status ON deposits
FOR EACH ROW
WHEN (OLD.status = 'pending' AND NEW.status = 'approved')
EXECUTE FUNCTION handle_deposit_approval();
