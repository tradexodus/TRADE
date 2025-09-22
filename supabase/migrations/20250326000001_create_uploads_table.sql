CREATE TABLE IF NOT EXISTS uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads(created_at);

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own uploads" ON uploads;
CREATE POLICY "Users can view their own uploads"
ON uploads FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own uploads" ON uploads;
CREATE POLICY "Users can insert their own uploads"
ON uploads FOR INSERT
WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE uploads;