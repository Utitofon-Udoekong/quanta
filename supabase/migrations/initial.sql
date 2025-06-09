-- Consolidated database schema migration
-- This file combines all database schema and features from the initial setup and subsequent migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (core table)
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Changed to TEXT to store wallet address
  wallet_address TEXT NOT NULL UNIQUE,
  wallet_chain TEXT DEFAULT 'xion-testnet-2',
  wallet_metadata JSONB DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  CONSTRAINT valid_wallet_chain CHECK (wallet_chain = 'xion-testnet-2')
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
  user_id TEXT REFERENCES users(id) NOT NULL, -- Changed to TEXT to match users.id
  thumbnail_url TEXT
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
  user_id TEXT REFERENCES users(id) NOT NULL -- Changed to TEXT to match users.id
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
  user_id TEXT REFERENCES users(id) NOT NULL, -- Changed to TEXT to match users.id
  thumbnail_url TEXT
);

-- Create content_views table (analytics)
CREATE TABLE content_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'audio')),
  user_id TEXT REFERENCES users(id) NOT NULL, -- Changed to TEXT to match users.id
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_content_view UNIQUE (content_id, user_id)
);

-- Create earnings table
CREATE TABLE earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) NOT NULL, -- Changed to TEXT to match users.id
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'audio')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) NOT NULL, -- Changed to TEXT to match users.id
  plan_id VARCHAR(50) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method VARCHAR(50),
  payment_status TEXT CHECK (payment_status IN ('succeeded', 'failed', 'pending')),
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE
);

-- Create subscription payments table
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  payment_method VARCHAR(50) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  transaction_hash TEXT,
  wallet_address TEXT,
  wallet_chain TEXT DEFAULT 'xion-testnet-2'
);

-- Create indexes
CREATE INDEX users_wallet_address_idx ON users (wallet_address);
CREATE INDEX users_wallet_chain_idx ON users (wallet_chain);

CREATE INDEX articles_user_category_idx ON articles (user_id, category);
CREATE INDEX articles_published_premium_idx ON articles (published, is_premium);

CREATE INDEX videos_user_category_idx ON videos (user_id, category);
CREATE INDEX videos_published_premium_idx ON videos (published, is_premium);

CREATE INDEX audio_user_category_idx ON audio (user_id, category);
CREATE INDEX audio_published_premium_idx ON audio (published, is_premium);

CREATE INDEX content_views_content_idx ON content_views (content_id, content_type);
CREATE INDEX content_views_viewed_at_idx ON content_views (viewed_at);

CREATE INDEX earnings_user_content_idx ON earnings (user_id, content_id, content_type);
CREATE INDEX earnings_created_at_idx ON earnings (created_at);

CREATE INDEX subscriptions_user_id_idx ON subscriptions (user_id);
CREATE INDEX subscriptions_plan_id_idx ON subscriptions (plan_id);
CREATE INDEX subscriptions_status_idx ON subscriptions (status);
CREATE INDEX subscriptions_current_period_end_idx ON subscriptions (current_period_end);

CREATE INDEX subscription_payments_subscription_id_idx ON subscription_payments (subscription_id);
CREATE INDEX subscription_payments_status_idx ON subscription_payments (status);
CREATE INDEX subscription_payments_payment_date_idx ON subscription_payments (payment_date);
CREATE INDEX idx_subscription_payments_transaction_hash ON subscription_payments(transaction_hash);
CREATE INDEX idx_subscription_payments_wallet_address ON subscription_payments(wallet_address);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Content policies (articles, videos, audio)
CREATE POLICY "Published content is viewable by everyone" ON articles
  FOR SELECT USING (published = true OR user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can insert their own content" ON articles
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can update their own content" ON articles
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can delete their own content" ON articles
  FOR DELETE USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Replicate content policies for videos and audio
CREATE POLICY "Published content is viewable by everyone" ON videos
  FOR SELECT USING (published = true OR user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can insert their own content" ON videos
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can update their own content" ON videos
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can delete their own content" ON videos
  FOR DELETE USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Published content is viewable by everyone" ON audio
  FOR SELECT USING (published = true OR user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can insert their own content" ON audio
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can update their own content" ON audio
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can delete their own content" ON audio
  FOR DELETE USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Content views policies
CREATE POLICY "Users can view content view analytics" ON content_views
  FOR SELECT USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Anyone can insert content views" ON content_views
  FOR INSERT WITH CHECK (true);

-- Earnings policies
CREATE POLICY "Users can view their own earnings" ON earnings
  FOR SELECT USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Subscription payments policies
CREATE POLICY "Users can view their own subscription payments" ON subscription_payments
  FOR SELECT USING (
    wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
  );

CREATE POLICY "Users can insert their own subscription payments" ON subscription_payments
  FOR INSERT WITH CHECK (
    wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
  );

-- Create subscription management functions
CREATE OR REPLACE FUNCTION create_subscription(
    p_wallet_address TEXT,
    p_plan_id VARCHAR(50),
    p_payment_method VARCHAR(50),
    p_subscription_data JSONB
)
RETURNS subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription subscriptions;
    v_payment_id UUID;
    v_amount DECIMAL(10,2);
    v_currency VARCHAR(3);
    v_status VARCHAR(20);
    v_payment_status VARCHAR(20);
BEGIN
    -- Validate required fields
    IF p_wallet_address IS NULL THEN
        RAISE EXCEPTION 'Wallet address is required';
    END IF;

    IF p_plan_id IS NULL THEN
        RAISE EXCEPTION 'Plan ID is required';
    END IF;

    IF p_payment_method IS NULL THEN
        RAISE EXCEPTION 'Payment method is required';
    END IF;

    -- Extract and validate values from JSONB
    v_amount := (p_subscription_data->>'amount')::DECIMAL;
    v_currency := COALESCE(p_subscription_data->>'currency', 'USD');
    v_status := COALESCE(p_subscription_data->>'status', 'active');
    v_payment_status := COALESCE(p_subscription_data->>'payment_status', 'succeeded');

    -- Validate amount
    IF v_amount IS NULL OR v_amount < 0 THEN
        RAISE EXCEPTION 'Invalid amount';
    END IF;

    -- Begin transaction
    BEGIN
        -- Create subscription
        INSERT INTO subscriptions (
            user_id,
            plan_id,
            status,
            current_period_start,
            current_period_end,
            payment_method,
            payment_status,
            last_payment_date,
            next_payment_date,
            created_at,
            updated_at,
            cancel_at_period_end,
            canceled_at
        )
        VALUES (
            p_wallet_address,
            p_plan_id,
            v_status,
            (p_subscription_data->>'current_period_start')::TIMESTAMP WITH TIME ZONE,
            (p_subscription_data->>'current_period_end')::TIMESTAMP WITH TIME ZONE,
            p_payment_method,
            v_payment_status,
            CURRENT_TIMESTAMP,
            (p_subscription_data->>'current_period_end')::TIMESTAMP WITH TIME ZONE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            FALSE,
            NULL
        )
        RETURNING * INTO v_subscription;

        -- Create initial payment record
        INSERT INTO subscription_payments (
            subscription_id,
            amount,
            currency,
            status,
            payment_method,
            payment_date,
            created_at,
            updated_at,
            wallet_address,
            wallet_chain
        )
        VALUES (
            v_subscription.id,
            v_amount,
            v_currency,
            v_payment_status,
            p_payment_method,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            p_wallet_address,
            'xion-testnet-2'
        )
        RETURNING id INTO v_payment_id;

        RETURN v_subscription;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to create subscription: %', SQLERRM;
    END;
END;
$$;

CREATE OR REPLACE FUNCTION renew_subscription(
    p_subscription_id UUID,
    p_wallet_address TEXT,
    p_renewal_data JSONB
)
RETURNS subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription subscriptions;
    v_payment_id UUID;
    v_amount DECIMAL(10,2);
    v_currency VARCHAR(3);
    v_status VARCHAR(20);
    v_payment_status VARCHAR(20);
BEGIN
    -- Verify subscription exists and belongs to user
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE id = p_subscription_id AND user_id = p_wallet_address;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription not found or unauthorized';
    END IF;

    -- Extract and validate values from JSONB
    v_amount := (p_renewal_data->>'amount')::DECIMAL;
    v_currency := COALESCE(p_renewal_data->>'currency', 'USD');
    v_status := COALESCE(p_renewal_data->>'status', 'active');
    v_payment_status := COALESCE(p_renewal_data->>'payment_status', 'succeeded');

    -- Validate amount
    IF v_amount IS NULL OR v_amount < 0 THEN
        RAISE EXCEPTION 'Invalid amount';
    END IF;

    -- Begin transaction
    BEGIN
        -- Update subscription
        UPDATE subscriptions
        SET
            current_period_start = (p_renewal_data->>'current_period_start')::TIMESTAMP WITH TIME ZONE,
            current_period_end = (p_renewal_data->>'current_period_end')::TIMESTAMP WITH TIME ZONE,
            payment_method = p_renewal_data->>'payment_method',
            payment_status = v_payment_status,
            last_payment_date = CURRENT_TIMESTAMP,
            next_payment_date = (p_renewal_data->>'current_period_end')::TIMESTAMP WITH TIME ZONE,
            updated_at = CURRENT_TIMESTAMP,
            status = v_status
        WHERE id = p_subscription_id
        RETURNING * INTO v_subscription;

        -- Create payment record
        INSERT INTO subscription_payments (
            subscription_id,
            amount,
            currency,
            status,
            payment_method,
            payment_date,
            created_at,
            updated_at,
            wallet_address,
            wallet_chain
        )
        VALUES (
            p_subscription_id,
            v_amount,
            v_currency,
            v_payment_status,
            p_renewal_data->>'payment_method',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            p_wallet_address,
            'xion-testnet-2'
        )
        RETURNING id INTO v_payment_id;

        RETURN v_subscription;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to renew subscription: %', SQLERRM;
    END;
END;
$$;

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
    AND current_setting('request.jwt.claims')::json->>'wallet_address' IS NOT NULL
  );

-- Add comments to explain the columns
COMMENT ON COLUMN articles.thumbnail_url IS 'URL to the article thumbnail image';
COMMENT ON COLUMN audio.thumbnail_url IS 'URL to the audio thumbnail image';
COMMENT ON COLUMN subscription_payments.transaction_hash IS 'The transaction hash from the blockchain for this payment';
COMMENT ON COLUMN subscription_payments.wallet_address IS 'The wallet address used for the payment';
COMMENT ON COLUMN subscription_payments.wallet_chain IS 'The blockchain network used for the payment';
COMMENT ON TABLE content_views IS 'Tracks views of content items, ensuring each user can only count once per piece of content';

-- Engagement Features: Likes and Comments

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
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Create trigger for updating comment timestamps
CREATE TRIGGER update_comment_timestamp
    BEFORE UPDATE ON content_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_timestamp(); 