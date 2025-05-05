-- Create trading_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS trading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  crypto_pair TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL,
  profit_loss NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes TEXT,
  expiration_time TIMESTAMP WITH TIME ZONE,
  original_balance NUMERIC
);

-- Enable row-level security
ALTER TABLE trading_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own trades
DROP POLICY IF EXISTS "Users can view their own trades" ON trading_history;
CREATE POLICY "Users can view their own trades"
  ON trading_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own trades
DROP POLICY IF EXISTS "Users can insert their own trades" ON trading_history;
CREATE POLICY "Users can insert their own trades"
  ON trading_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own trades
DROP POLICY IF EXISTS "Users can update their own trades" ON trading_history;
CREATE POLICY "Users can update their own trades"
  ON trading_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add to realtime publication
alter publication supabase_realtime add table trading_history;
