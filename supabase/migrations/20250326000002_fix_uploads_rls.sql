-- Disable RLS temporarily to fix the issue
ALTER TABLE uploads DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with proper policies
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can insert their own uploads" ON uploads;

-- Create more permissive policies
CREATE POLICY "Enable read access for authenticated users" ON uploads
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON uploads
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON uploads
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON uploads
FOR DELETE USING (auth.uid() = user_id);