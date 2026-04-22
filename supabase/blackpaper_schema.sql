-- Create extension if missing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Blackpaper table
CREATE TABLE IF NOT EXISTS public.blackpapers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cart_id TEXT,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    enriched_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_flags JSONB NOT NULL DEFAULT '{"errors": [], "warnings": []}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending_enrichment' CHECK (status IN ('pending_enrichment', 'processing', 'review_ready', 'validation_failed', 'approved', 'rejected', 'changes_requested')),
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_blackpapers_status ON public.blackpapers(status);

-- Ensure RLS is configured as appropriate. Example enabling for public inserts:
-- ALTER TABLE public.blackpapers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable insert for authenticated users only" ON public.blackpapers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
