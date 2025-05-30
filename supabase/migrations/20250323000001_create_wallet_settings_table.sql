-- Create wallet_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE wallet_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for all users to read wallet_settings
DROP POLICY IF EXISTS "Allow read access for all users" ON wallet_settings;
CREATE POLICY "Allow read access for all users" ON wallet_settings
  FOR SELECT USING (true);

-- Create policy for admins to modify wallet_settings
DROP POLICY IF EXISTS "Allow admin write access" ON wallet_settings;
CREATE POLICY "Allow admin write access" ON wallet_settings
  FOR ALL USING (auth.uid() IN (SELECT auth.uid() FROM auth.users WHERE auth.uid() = auth.uid()));

-- Add to realtime publication
alter publication supabase_realtime add table wallet_settings;

-- Insert default wallet address if none exists
INSERT INTO wallet_settings (wallet_address)
SELECT 'TRC20WalletAddressDefault123456789'
WHERE NOT EXISTS (SELECT 1 FROM wallet_settings);
