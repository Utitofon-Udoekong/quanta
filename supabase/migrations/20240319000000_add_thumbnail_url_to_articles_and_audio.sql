-- Add thumbnail_url column to articles table
ALTER TABLE articles ADD COLUMN thumbnail_url TEXT;

-- Add thumbnail_url column to audio table
ALTER TABLE audio ADD COLUMN thumbnail_url TEXT;
 
-- Add comment to explain the columns
COMMENT ON COLUMN articles.thumbnail_url IS 'URL to the article thumbnail image';
COMMENT ON COLUMN audio.thumbnail_url IS 'URL to the audio thumbnail image'; 