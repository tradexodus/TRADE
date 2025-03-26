CREATE TABLE IF NOT EXISTS trading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  crypto_pair TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  profit_loss NUMERIC DEFAULT 0,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes TEXT
);

ALTER TABLE trading_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own trading history" ON trading_history;
CREATE POLICY "Users can view their own trading history"
  ON trading_history
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trading history" ON trading_history;
CREATE POLICY "Users can insert their own trading history"
  ON trading_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trading history" ON trading_history;
CREATE POLICY "Users can update their own trading history"
  ON trading_history
  FOR UPDATE
  USING (auth.uid() = user_id);

alter publication supabase_realtime add table trading_history;