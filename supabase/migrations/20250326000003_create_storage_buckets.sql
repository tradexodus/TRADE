-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('deposits', 'deposits', false),
  ('deposit-screenshots', 'deposit-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for deposits bucket
CREATE POLICY "Authenticated users can upload to deposits" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'deposits' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own deposits" ON storage.objects
FOR SELECT USING (
  bucket_id = 'deposits' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own deposits" ON storage.objects
FOR DELETE USING (
  bucket_id = 'deposits' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for deposit-screenshots bucket
CREATE POLICY "Authenticated users can upload to deposit-screenshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'deposit-screenshots' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own deposit-screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'deposit-screenshots' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own deposit-screenshots" ON storage.objects
FOR DELETE USING (
  bucket_id = 'deposit-screenshots' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);