-- Add release_date column to content tables
-- This enables scheduling functionality for content publishing

ALTER TABLE videos 
ADD COLUMN release_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE audio 
ADD COLUMN release_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE articles 
ADD COLUMN release_date TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying of scheduled content
CREATE INDEX videos_release_date_idx ON videos (release_date);
CREATE INDEX audio_release_date_idx ON audio (release_date);
CREATE INDEX articles_release_date_idx ON articles (release_date); 