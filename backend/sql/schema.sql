-- QuickNote Supabase PostgreSQL Schema
-- Version: 1.0

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: notes
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT DEFAULT '',
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_is_deleted ON notes (is_deleted);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes (is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_is_favorite ON notes (is_favorite);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN (tags);

-- Trigger for auto-updating updated_at on record change
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_notes_updated_at ON notes;
CREATE TRIGGER set_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

