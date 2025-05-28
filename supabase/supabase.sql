-- Create users table (core table)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  avatar_url TEXT,
  wallet_address TEXT,
  bio TEXT,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Create content tables
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES users(id) NOT NULL
);

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES users(id) NOT NULL
);

CREATE TABLE audio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES users(id) NOT NULL
);

-- Create content_views table (analytics)
CREATE TABLE content_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'audio')),
  user_id UUID REFERENCES users(id) NOT NULL,
  viewer_id UUID REFERENCES users(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create earnings table
CREATE TABLE earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'audio')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX users_email_idx ON users (email) WHERE email IS NOT NULL;
CREATE INDEX users_wallet_address_idx ON users (wallet_address) WHERE wallet_address IS NOT NULL;

CREATE INDEX articles_user_category_idx ON articles (user_id, category);
CREATE INDEX articles_published_premium_idx ON articles (published, is_premium);

CREATE INDEX videos_user_category_idx ON videos (user_id, category);
CREATE INDEX videos_published_premium_idx ON videos (published, is_premium);

CREATE INDEX audio_user_category_idx ON audio (user_id, category);
CREATE INDEX audio_published_premium_idx ON audio (published, is_premium);

CREATE INDEX content_views_content_idx ON content_views (content_id, content_type);
CREATE INDEX content_views_user_viewer_idx ON content_views (user_id, viewer_id);
CREATE INDEX content_views_viewed_at_idx ON content_views (viewed_at);

CREATE INDEX earnings_user_content_idx ON earnings (user_id, content_id, content_type);
CREATE INDEX earnings_created_at_idx ON earnings (created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT
  USING (
    CASE 
      WHEN auth.uid() = id THEN true
      ELSE email IS NULL
    END
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Content policies (articles, videos, audio)
CREATE POLICY "Published content is viewable by everyone" ON articles
  FOR SELECT USING (published = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own content" ON articles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content" ON articles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content" ON articles
  FOR DELETE USING (auth.uid() = user_id);

-- Replicate content policies for videos and audio
CREATE POLICY "Published content is viewable by everyone" ON videos
  FOR SELECT USING (published = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own content" ON videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content" ON videos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content" ON videos
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Published content is viewable by everyone" ON audio
  FOR SELECT USING (published = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own content" ON audio
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content" ON audio
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content" ON audio
  FOR DELETE USING (auth.uid() = user_id);

-- Content views policies
CREATE POLICY "Users can view content view analytics" ON content_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert content views" ON content_views
  FOR INSERT WITH CHECK (true);

-- Earnings policies
CREATE POLICY "Users can view their own earnings" ON earnings
  FOR SELECT USING (auth.uid() = user_id);

-- Handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO users (
    id,
    email,
    created_at,
    updated_at,
    full_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.created_at,
    NEW.updated_at,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Setup storage
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('videos', 'videos', true),
  ('audio', 'audio', true),
  ('thumbnails', 'thumbnails', true);

-- Storage policies
CREATE POLICY "Content is viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id IN ('videos', 'audio', 'thumbnails'));

CREATE POLICY "Authenticated users can upload content" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('videos', 'audio', 'thumbnails') 
    AND auth.role() = 'authenticated'
  );