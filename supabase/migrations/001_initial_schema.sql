-- Note: Supabase Auth automatically creates auth.users table
-- We reference auth.users for user authentication

-- Create search_history table
-- user_id references auth.users.id (Supabase Auth user ID)
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  product_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on search_history for faster queries
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Create policies for search_history
-- Users can only see their own history
CREATE POLICY "Users can view their own search history" ON search_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own search history
CREATE POLICY "Users can insert their own search history" ON search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to insert (for non-authenticated searches)
CREATE POLICY "Allow anonymous insert on search_history" ON search_history
  FOR INSERT WITH CHECK (user_id IS NULL);

-- Allow anonymous users to view (optional - remove if you want authenticated-only)
CREATE POLICY "Allow anonymous read on search_history" ON search_history
  FOR SELECT USING (user_id IS NULL);

