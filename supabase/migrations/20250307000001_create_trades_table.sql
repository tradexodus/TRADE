-- Create trades table if it doesn't exist already
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  crypto_pair TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  profit_loss DECIMAL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable row level security
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
CREATE POLICY "Users can view their own trades"
  ON public.trades
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
CREATE POLICY "Users can insert their own trades"
  ON public.trades
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add to realtime publication
alter publication supabase_realtime add table public.trades;
