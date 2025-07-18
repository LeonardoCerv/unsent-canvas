-- Complete Database Setup for Unsent Canvas
-- Run this script in Supabase SQL Editor to set up the entire database
-- This script handles: table creation, constraints, indexes, RLS policies, and realtime

-- =============================================================================
-- 1. DROP EXISTING TABLE AND CONSTRAINTS (if running as reset)
-- =============================================================================
-- Uncomment the next line if you want to completely reset the database
-- DROP TABLE IF EXISTS public.notes CASCADE;

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

-- Create policies for anonymous public access
-- These policies allow anyone to read, create, delete, and update notes without authentication
-- This enables a completely anonymous experience where users don't need to sign up
CREATE POLICY "Allow anonymous read access" ON public.notes 
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access" ON public.notes 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access" ON public.notes 
    FOR DELETE USING (true);

CREATE POLICY "Allow anonymous update access" ON public.notes 
    FOR UPDATE USING (true);

-- =============================================================================
-- 7. ENABLE REALTIME
-- =============================================================================
-- Enable realtime for the notes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;

-- =============================================================================
-- 8. VERIFICATION QUERIES
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
    qual
FROM pg_policies 
WHERE tablename = 'notes' AND schemaname = 'public'
ORDER BY policyname;

-- =============================================================================
-- 9. TEST DATA (Optional - uncomment to add sample data)
-- =============================================================================
/*
-- Insert sample notes for testing
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
-- Your database is now ready for the Unsent Canvas application!
-- 
-- Summary of what was created:
-- ✓ notes table with proper schema
-- ✓ Constraints for data validation (15 char sent_to, 150 char message)
-- ✓ Performance indexes for queries
-- ✓ Anonymous access policies (no authentication required)
-- ✓ Realtime enabled for live updates
-- ✓ Support for infinite canvas (negative coordinates)
--
-- You can now run your Next.js application and start creating notes!
