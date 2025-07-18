-- =============================================================================
-- SECURE DATABASE SETUP for Unsent Canvas
-- =============================================================================
-- This script sets up the complete database with Row Level Security (RLS)
-- Run this script in Supabase SQL Editor to set up the entire secure database
-- 
-- Security Model:
-- ✓ Public read access (anyone can view notes)
-- ✓ Server-only write access (only service role can create/update/delete)
-- ✓ Rate limiting infrastructure
-- ✓ Admin moderation functions
-- =============================================================================

-- =============================================================================
-- 1. DROP EXISTING TABLE AND CONSTRAINTS (if running as reset)
-- =============================================================================
-- Uncomment the next line if you want to completely reset the database
-- DROP TABLE IF EXISTS public.notes CASCADE;
-- DROP TABLE IF EXISTS public.rate_limits CASCADE;

-- =============================================================================
-- 2. CREATE NOTES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_to TEXT NOT NULL,
  message TEXT NOT NULL,
  x INTEGER NOT NULL, -- Grid coordinates (can be negative for infinite canvas)
  y INTEGER NOT NULL, -- Grid coordinates (can be negative for infinite canvas)
  color TEXT DEFAULT '#fff3a0', -- Default sticky note yellow
  report_count INTEGER DEFAULT 0 NOT NULL -- Number of times this note has been reported
);

-- =============================================================================
-- 3. REMOVE ALL EXISTING CONSTRAINTS (clean slate)
-- =============================================================================
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'notes' AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END LOOP;
END $$;

-- =============================================================================
-- 4. ADD PROPER CONSTRAINTS
-- =============================================================================
ALTER TABLE public.notes
    ADD CONSTRAINT notes_sent_to_length_check
    CHECK (char_length(sent_to) <= 15);

ALTER TABLE public.notes
    ADD CONSTRAINT notes_message_length_check
    CHECK (char_length(message) <= 150);

ALTER TABLE public.notes
    ADD CONSTRAINT notes_sent_to_not_empty
    CHECK (char_length(trim(sent_to)) > 0);

ALTER TABLE public.notes
    ADD CONSTRAINT notes_message_not_empty
    CHECK (char_length(trim(message)) > 0);

ALTER TABLE public.notes
    ADD CONSTRAINT notes_report_count_positive
    CHECK (report_count >= 0);

-- =============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================
-- Drop existing indexes if they exist
DROP INDEX IF EXISTS notes_position_idx;
DROP INDEX IF EXISTS notes_created_at_idx;
DROP INDEX IF EXISTS notes_sent_to_idx;
DROP INDEX IF EXISTS notes_report_count_idx;

-- Create performance indexes
CREATE INDEX notes_position_idx ON public.notes(x, y);
CREATE INDEX notes_created_at_idx ON public.notes(created_at DESC);
CREATE INDEX notes_sent_to_idx ON public.notes(sent_to);
CREATE INDEX notes_report_count_idx ON public.notes(report_count DESC);

-- =============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.notes;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.notes;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.notes;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.notes;
DROP POLICY IF EXISTS "Public read access" ON public.notes;
DROP POLICY IF EXISTS "Server only insert access" ON public.notes;
DROP POLICY IF EXISTS "Server only update access" ON public.notes;
DROP POLICY IF EXISTS "Server only delete access" ON public.notes;

-- =============================================================================
-- 7. CREATE SECURE POLICIES
-- =============================================================================

-- Policy 1: Allow public read access (anyone can view notes)
CREATE POLICY "Public read access" ON public.notes
    FOR SELECT 
    USING (true);

-- Policy 2: Only allow inserts via service role (server only)
CREATE POLICY "Server only insert access" ON public.notes
    FOR INSERT 
    WITH CHECK (auth.role() = 'service_role');

-- Policy 3: Only allow updates via service role (server only)
CREATE POLICY "Server only update access" ON public.notes
    FOR UPDATE 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 4: Only allow deletes via service role (server only)
CREATE POLICY "Server only delete access" ON public.notes
    FOR DELETE 
    USING (auth.role() = 'service_role');

-- =============================================================================
-- 8. CREATE RATE LIMITING INFRASTRUCTURE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing rate limit policies
DROP POLICY IF EXISTS "Server only rate limit access" ON public.rate_limits;

-- Only server can manage rate limits
CREATE POLICY "Server only rate limit access" ON public.rate_limits
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS rate_limits_ip_action_idx 
ON public.rate_limits(ip_address, action, expires_at);

-- =============================================================================
-- 9. CREATE ADMIN FUNCTIONS
-- =============================================================================

-- Function to get server stats (only accessible to service role)
CREATE OR REPLACE FUNCTION get_server_stats()
RETURNS TABLE (
    total_notes bigint,
    notes_today bigint,
    reports_pending bigint
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow service role to access this function
    IF auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Service role required';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*) as total_notes,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as notes_today,
        COUNT(*) FILTER (WHERE report_count >= 5) as reports_pending
    FROM public.notes;
END;
$$ LANGUAGE plpgsql;

-- Function to moderate notes (only accessible to service role)
CREATE OR REPLACE FUNCTION moderate_note(note_id UUID, action TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow service role to access this function
    IF auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Service role required';
    END IF;
    
    IF action = 'delete' THEN
        DELETE FROM public.notes WHERE id = note_id;
        RETURN TRUE;
    ELSIF action = 'reset_reports' THEN
        UPDATE public.notes SET report_count = 0 WHERE id = note_id;
        RETURN TRUE;
    ELSE
        RAISE EXCEPTION 'Invalid action: %', action;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(client_ip INET, limit_action TEXT, limit_count INTEGER, limit_window INTERVAL)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Only allow service role to access this function
    IF auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Service role required';
    END IF;
    
    window_start := NOW() - limit_window;
    
    -- Count recent actions from this IP
    SELECT COUNT(*) INTO current_count
    FROM public.rate_limits
    WHERE ip_address = client_ip
      AND action = limit_action
      AND created_at >= window_start;
    
    -- Clean up expired entries
    DELETE FROM public.rate_limits
    WHERE expires_at < NOW();
    
    -- Check if limit is exceeded
    IF current_count >= limit_count THEN
        RETURN FALSE;
    END IF;
    
    -- Record this action
    INSERT INTO public.rate_limits (ip_address, action, expires_at)
    VALUES (client_ip, limit_action, NOW() + limit_window);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 10. ENABLE REALTIME
-- =============================================================================
-- Enable realtime for the notes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;

-- =============================================================================
-- 11. VERIFICATION QUERIES
-- =============================================================================
-- Check constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'notes' AND contype = 'c'
ORDER BY conname;

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'notes' AND schemaname = 'public'
ORDER BY indexname;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('notes', 'rate_limits') AND schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- 12. TEST DATA (Optional - uncomment to add sample data)
-- =============================================================================
/*
-- Insert sample notes for testing (will only work if service role is active)
INSERT INTO public.notes (sent_to, message, x, y, color) VALUES
    ('Alice', 'Hello world!', 0, 0, '#fff3a0'),
    ('Bob', 'This is a test note', 5, 3, '#fce7f3'),
    ('Charlie', 'Negative coordinates work too', -2, -1, '#e0f2fe'),
    ('Diana', 'Another test message', 10, -5, '#ecfdf5');

-- Verify the test data
SELECT id, sent_to, message, x, y, color, created_at FROM public.notes ORDER BY created_at DESC;
*/

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================
-- Your database is now ready for the Unsent Canvas application with secure RLS!
-- 
-- Summary of what was created:
-- ✓ notes table with proper schema and constraints
-- ✓ Performance indexes for efficient queries
-- ✓ Row Level Security (RLS) enabled
-- ✓ Public read access (anyone can view notes)
-- ✓ Server-only write access (only service role can create/update/delete)
-- ✓ Rate limiting infrastructure
-- ✓ Admin moderation functions
-- ✓ Realtime enabled for live updates
-- ✓ Support for infinite canvas (negative coordinates)
--
-- IMPORTANT: Make sure your .env file contains:
-- NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
-- SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
-- ADMIN_API_KEY=your_secure_admin_key
--
-- You can now run your Next.js application securely!
