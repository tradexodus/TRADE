-- This migration fixes the column name issue

-- Check if we need to rename the column
DO $$ 
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns 
           WHERE table_name='trading_history' AND column_name='expiry_time') THEN
      ALTER TABLE trading_history RENAME COLUMN expiry_time TO expiration_time;
  END IF;
END $$;

-- If the column doesn't exist at all, create it
DO $$ 
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
               WHERE table_name='trading_history' AND column_name='expiration_time') THEN
      ALTER TABLE trading_history ADD COLUMN expiration_time TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Update existing pending trades with calculated expiration_time
UPDATE trading_history
SET expiration_time = created_at + (duration_minutes::integer * interval '1 minute')
WHERE status = 'pending' AND expiration_time IS NULL;
