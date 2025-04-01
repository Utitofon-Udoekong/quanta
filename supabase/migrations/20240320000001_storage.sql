-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public)
VALUES ('content', 'content', true);

-- Create storage policies
CREATE POLICY "Anyone can view content files"
ON storage.objects FOR SELECT
USING (bucket_id = 'content');

CREATE POLICY "Authenticated users can upload content files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'content'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Content owners can update their files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'content'
    AND auth.uid() = (
        SELECT creator_id
        FROM content
        WHERE content_url LIKE '%' || name
    )
);

CREATE POLICY "Content owners can delete their files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'content'
    AND auth.uid() = (
        SELECT creator_id
        FROM content
        WHERE content_url LIKE '%' || name
    )
); 