-- Create trades table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    crypto_pair TEXT NOT NULL,
    trade_type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    profit_loss NUMERIC,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Only add the foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'trades_user_id_fkey'
    ) THEN
        ALTER TABLE public.trades 
        ADD CONSTRAINT trades_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id);
    END IF;
END
$$;

-- Enable row level security
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
CREATE POLICY "Users can view their own trades"
ON public.trades FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
CREATE POLICY "Users can insert their own trades"
ON public.trades FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;