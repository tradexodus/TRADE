CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  amount DECIMAL NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  from_balance DECIMAL NOT NULL DEFAULT 0,
  from_profit DECIMAL NOT NULL DEFAULT 0
);

-- Enable realtime for the withdrawals table
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'withdrawals'
  ) THEN
    alter publication supabase_realtime add table withdrawals;
  END IF;
END
$;
