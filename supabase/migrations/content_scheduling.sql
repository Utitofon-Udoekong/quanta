-- Simple Content Scheduling
-- Add release_date column to content tables and basic publish function

-- Add release_date column to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE;

-- Add release_date column to videos  
ALTER TABLE videos ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE;

-- Add release_date column to audio
ALTER TABLE audio ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE;

-- Simple function to publish scheduled content
CREATE OR REPLACE FUNCTION publish_scheduled_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Publish scheduled articles
    UPDATE articles 
    SET published = true, updated_at = NOW()
    WHERE published = false 
    AND release_date IS NOT NULL 
    AND release_date <= NOW();
    
    -- Publish scheduled videos
    UPDATE videos 
    SET published = true, updated_at = NOW()
    WHERE published = false 
    AND release_date IS NOT NULL 
    AND release_date <= NOW();
    
    -- Publish scheduled audio
    UPDATE audio 
    SET published = true, updated_at = NOW()
    WHERE published = false 
    AND release_date IS NOT NULL 
    AND release_date <= NOW();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION publish_scheduled_content() TO authenticated;

-- Create a cron job to run every 5 minutes using Supabase's native cron
SELECT cron.schedule(
    'publish-scheduled-content',
    '*/5 * * * *', -- Every 5 minutes
    'SELECT publish_scheduled_content();'
);
