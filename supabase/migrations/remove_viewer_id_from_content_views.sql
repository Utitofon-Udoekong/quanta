-- Migration to add a unique constraint on (content_id, user_id) in content_views table
-- This ensures each user can only count once per piece of content

-- First, drop the old constraint if it exists
DO $$
BEGIN
    -- Check if the constraint exists before trying to drop it
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_content_view'
    ) THEN
        ALTER TABLE content_views DROP CONSTRAINT unique_content_view;
    END IF;
END $$;

-- Then, drop the viewer_id column if it exists
DO $$
BEGIN
    -- Check if the column exists before trying to drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content_views' 
        AND column_name = 'viewer_id'
    ) THEN
        ALTER TABLE content_views DROP COLUMN viewer_id;
    END IF;
END $$;

-- Finally, add the new unique constraint on (content_id, user_id)
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_content_view'
    ) THEN
        ALTER TABLE content_views ADD CONSTRAINT unique_content_view UNIQUE (content_id, user_id);
    END IF;
END $$;

-- Add a comment to explain the change
COMMENT ON TABLE content_views IS 'Tracks views of content items, ensuring each user can only count once per piece of content'; 