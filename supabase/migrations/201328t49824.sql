ALTER TABLE content_views 
ADD CONSTRAINT unique_content_view 
UNIQUE (content_id, viewer_id);