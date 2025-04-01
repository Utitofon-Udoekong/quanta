-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE content_type AS ENUM ('VIDEO', 'AUDIO');
CREATE TYPE content_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE pricing_model AS ENUM ('PER_USE', 'PER_MINUTE', 'CUSTOM');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    meta_account_id TEXT UNIQUE,
    full_name TEXT,
    email TEXT UNIQUE,
    is_creator BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    bio TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create content table
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type content_type NOT NULL,
    status content_status DEFAULT 'DRAFT',
    price DECIMAL(10,2) DEFAULT 0,
    pricing_model pricing_model DEFAULT 'PER_USE',
    creator_id UUID NOT NULL REFERENCES users(id),
    thumbnail_url TEXT,
    content_url TEXT NOT NULL,
    duration INTEGER,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    content_id UUID REFERENCES content(id),
    amount DECIMAL(10,2) NOT NULL,
    status payment_status DEFAULT 'PENDING',
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create content_usage table
CREATE TABLE content_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    content_id UUID NOT NULL REFERENCES content(id),
    payment_id UUID REFERENCES payments(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, content_id, payment_id)
);

-- Create indexes
CREATE INDEX idx_content_creator_id ON content(creator_id);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_payments_from_user_id ON payments(from_user_id);
CREATE INDEX idx_payments_to_user_id ON payments(to_user_id);
CREATE INDEX idx_payments_content_id ON payments(content_id);
CREATE INDEX idx_content_usage_user_content ON content_usage(user_id, content_id);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_usage ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = wallet_address);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Content policies
CREATE POLICY "Anyone can view published content" ON content
    FOR SELECT USING (status = 'PUBLISHED');

CREATE POLICY "Creators can manage their own content" ON content
    FOR ALL USING (creator_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text));

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (
        from_user_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text) OR
        to_user_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text)
    );

CREATE POLICY "Users can create payments" ON payments
    FOR INSERT WITH CHECK (
        from_user_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text)
    );

-- Content usage policies
CREATE POLICY "Users can view their own usage" ON content_usage
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text)
    );

CREATE POLICY "Users can create usage records" ON content_usage
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE wallet_address = auth.uid()::text)
    );

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_usage_updated_at
    BEFORE UPDATE ON content_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 