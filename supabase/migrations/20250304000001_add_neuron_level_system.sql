-- Add neuron_level column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS neuron_level VARCHAR(50) DEFAULT 'Beginner';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS neuron_level_percentage NUMERIC(5,2) DEFAULT 2.5;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_deposit_amount NUMERIC(15,2) DEFAULT 0;

-- Create function to update neuron level based on total deposit amount
CREATE OR REPLACE FUNCTION update_neuron_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Update neuron level based on total deposit amount
  IF NEW.total_deposit_amount >= 50001 THEN
    NEW.neuron_level := 'Elite';
    NEW.neuron_level_percentage := 13.4;
  ELSIF NEW.total_deposit_amount >= 10001 THEN
    NEW.neuron_level := 'VIP';
    NEW.neuron_level_percentage := 7;
  ELSIF NEW.total_deposit_amount >= 5001 THEN
    NEW.neuron_level := 'Pro';
    NEW.neuron_level_percentage := 5;
  ELSIF NEW.total_deposit_amount >= 1001 THEN
    NEW.neuron_level := 'Advanced';
    NEW.neuron_level_percentage := 4;
  ELSIF NEW.total_deposit_amount >= 201 THEN
    NEW.neuron_level := 'Intermediate';
    NEW.neuron_level_percentage := 3;
  ELSE
    NEW.neuron_level := 'Beginner';
    NEW.neuron_level_percentage := 2.5;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update neuron level when total_deposit_amount changes
DROP TRIGGER IF EXISTS update_neuron_level_trigger ON user_profiles;
CREATE TRIGGER update_neuron_level_trigger
BEFORE UPDATE OF total_deposit_amount ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_neuron_level();

-- Add the table to realtime publication
alter publication supabase_realtime add table user_profiles;