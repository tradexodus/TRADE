CREATE TABLE IF NOT EXISTS trading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  crypto_pair TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  profit_loss NUMERIC,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes TEXT
);

alter publication supabase_realtime add table trading_history;