-- Create the notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_to TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 150),
  x INTEGER NOT NULL,
  y INTEGER NOT NULL
);

-- Create indexes for better performance
CREATE INDEX notes_position_idx ON notes(x, y);
CREATE INDEX notes_created_at_idx ON notes(created_at);
CREATE INDEX notes_sent_to_idx ON notes(sent_to);

-- Enable Row Level Security (RLS)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous public access
-- These policies allow anyone to read, create, and delete notes without authentication
-- This enables a completely anonymous experience where users don't need to sign up
CREATE POLICY "Allow anonymous read access" ON notes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete access" ON notes FOR DELETE USING (true);

-- Enable realtime for the notes table
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
