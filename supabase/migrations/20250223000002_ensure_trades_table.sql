-- Create trades table if it doesn't exist
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  crypto_pair TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  profit_loss DECIMAL NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable realtime
alter publication supabase_realtime add table trades;
