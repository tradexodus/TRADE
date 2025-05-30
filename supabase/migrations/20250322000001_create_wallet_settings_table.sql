-- Create wallet_settings table
CREATE TABLE IF NOT EXISTS wallet_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    wallet_type TEXT NOT NULL DEFAULT 'bitcoin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime (only if not already added)
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'wallet_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE wallet_settings;
    END IF;
END $;
