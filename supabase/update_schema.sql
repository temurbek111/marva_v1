-- Run this in your Supabase SQL Editor


ALTER TABLE products
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS validation_warnings JSONB DEFAULT '[]'::jsonb;

-- New table for product description enrichment
CREATE TABLE IF NOT EXISTS blackpaper (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id BIGINT UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  name TEXT,
  generated_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready_for_review', 'published', 'failed', 'rejected')),
  source TEXT DEFAULT 'backfill',
  validation_flags JSONB DEFAULT '{}'::jsonb,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_blackpaper_status ON blackpaper(status);
CREATE INDEX IF NOT EXISTS idx_blackpaper_product_id ON blackpaper(product_id);

-- Initial bulk insert for products without descriptions
INSERT INTO blackpaper (product_id, name, status, source)
SELECT id, name, 'pending', 'backfill'
FROM products
WHERE description IS NULL OR description = ''
ON CONFLICT (product_id) DO NOTHING;
