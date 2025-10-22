-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Create index for active subscribers
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for subscriptions)
CREATE POLICY "Allow public insert" ON subscribers
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow authenticated users to read all subscribers (for admin)
CREATE POLICY "Allow authenticated read" ON subscribers
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to update (for admin)
CREATE POLICY "Allow authenticated update" ON subscribers
  FOR UPDATE TO authenticated
  USING (true);

-- Allow authenticated users to delete (for admin)
CREATE POLICY "Allow authenticated delete" ON subscribers
  FOR DELETE TO authenticated
  USING (true);

-- Add comment
COMMENT ON TABLE subscribers IS 'Email subscribers for blog post notifications';
