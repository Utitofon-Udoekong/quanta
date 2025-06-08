-- Create likes table
CREATE TABLE content_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'audio')),
    user_id TEXT NOT NULL REFERENCES users(wallet_address),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, content_type, user_id)
);

-- Create comments table
CREATE TABLE content_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'audio')),
    user_id TEXT NOT NULL REFERENCES users(wallet_address),
    parent_id UUID REFERENCES content_comments(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_content_likes_content ON content_likes(content_id, content_type);
CREATE INDEX idx_content_likes_user ON content_likes(user_id);
CREATE INDEX idx_content_comments_content ON content_comments(content_id, content_type);
CREATE INDEX idx_content_comments_user ON content_comments(user_id);
CREATE INDEX idx_content_comments_parent ON content_comments(parent_id);

-- Enable Row Level Security
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for likes
CREATE POLICY "Users can view all likes"
    ON content_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like content"
    ON content_likes FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can unlike their own likes"
    ON content_likes FOR DELETE
    USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Create RLS policies for comments
CREATE POLICY "Users can view all comments"
    ON content_comments FOR SELECT
    USING (true);

CREATE POLICY "Users can create comments"
    ON content_comments FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can update their own comments"
    ON content_comments FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address')
    WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can delete their own comments"
    ON content_comments FOR DELETE
    USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Create function to update comment's updated_at timestamp
CREATE OR REPLACE FUNCTION update_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating comment timestamps
CREATE TRIGGER update_comment_timestamp
    BEFORE UPDATE ON content_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_timestamp(); 