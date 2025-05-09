-- Make sure the trading_history table exists first
CREATE TABLE IF NOT EXISTS trading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  crypto_pair TEXT,
  trade_type TEXT,
  amount NUMERIC,
  price NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  profit_loss NUMERIC DEFAULT 0
);

-- Add the ai_reasoning column if it doesn't exist
ALTER TABLE trading_history ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;

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
END
$$;