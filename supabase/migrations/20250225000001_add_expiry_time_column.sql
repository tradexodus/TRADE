-- Add expiry_time column to trading_history table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
               WHERE table_name='trading_history' AND column_name='expiry_time') THEN
      ALTER TABLE trading_history ADD COLUMN expiry_time TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Update existing pending trades with calculated expiry_time
UPDATE trading_history
SET expiry_time = created_at + (duration_minutes::integer * interval '1 minute')
WHERE status = 'pending' AND expiry_time IS NULL;

-- Check if the table is already in the publication before adding it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'trading_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE trading_history;
  END IF;
END $$;
