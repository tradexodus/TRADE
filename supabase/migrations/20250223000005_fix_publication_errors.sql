-- This migration checks if tables exist in the publication before adding them

-- For trading_settings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'trading_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE trading_settings;
  END IF;
END
$$;

-- For trading_history table
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
END
$$;
