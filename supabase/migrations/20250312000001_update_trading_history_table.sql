-- Make duration_minutes nullable
ALTER TABLE trading_history ALTER COLUMN duration_minutes DROP NOT NULL;

-- Add entry_price column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trading_history' AND column_name = 'entry_price') THEN
    ALTER TABLE trading_history ADD COLUMN entry_price NUMERIC;
  END IF;
END $$;

-- Add close_price column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trading_history' AND column_name = 'close_price') THEN
    ALTER TABLE trading_history ADD COLUMN close_price NUMERIC;
  END IF;
END $$;
