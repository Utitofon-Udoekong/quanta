-- Migration to revert to simple, clean subscription schema
-- This replaces the overcomplicated bidirectional tables with the original proposal

-- Drop the overcomplicated tables and functions (with IF EXISTS for safety)
-- Note: We can't use IF EXISTS for triggers, so we'll handle this differently
DO $$
BEGIN
    -- Drop triggers if they exist (this is safer than direct DROP)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
        DROP TRIGGER IF EXISTS sync_subscription_tables_trigger ON user_subscriptions;
        DROP TRIGGER IF EXISTS update_user_subscription_timestamp ON user_subscriptions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'creator_subscribers') THEN
        DROP TRIGGER IF EXISTS update_creator_subscriber_timestamp ON creator_subscribers;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if tables don't exist
        NULL;
END $$;

DROP FUNCTION IF EXISTS sync_subscription_tables() CASCADE;
DROP FUNCTION IF EXISTS update_subscription_timestamp() CASCADE;
DROP FUNCTION IF EXISTS subscribe_to_creator(UUID, UUID, TEXT, NUMERIC, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS cancel_subscription(UUID, UUID) CASCADE;

DROP VIEW IF EXISTS subscription_analytics;

-- Drop the overcomplicated tables (with CASCADE to handle dependencies)
DROP TABLE IF EXISTS creator_subscribers CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- Drop old subscription infrastructure (if it still exists)
DROP FUNCTION IF EXISTS create_subscription(UUID, VARCHAR(50), VARCHAR(50), JSONB) CASCADE;
DROP FUNCTION IF EXISTS renew_subscription(UUID, UUID, JSONB) CASCADE;

DROP TABLE IF EXISTS subscription_payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Drop old indexes (with IF EXISTS)
DROP INDEX IF EXISTS subscriptions_user_id_idx;
DROP INDEX IF EXISTS subscriptions_plan_id_idx;
DROP INDEX IF EXISTS subscriptions_status_idx;
DROP INDEX IF EXISTS subscriptions_current_period_end_idx;
DROP INDEX IF EXISTS subscription_payments_subscription_id_idx;
DROP INDEX IF EXISTS subscription_payments_status_idx;
DROP INDEX IF EXISTS subscription_payments_payment_date_idx;
DROP INDEX IF EXISTS idx_subscription_payments_transaction_hash;
DROP INDEX IF EXISTS idx_subscription_payments_wallet_address;

-- Drop old policies (with IF EXISTS)
DO $$
BEGIN
    -- Only try to drop policies if the tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
        DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
        DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_payments') THEN
        DROP POLICY IF EXISTS "Users can view their own subscription payments" ON subscription_payments;
        DROP POLICY IF EXISTS "Users can insert their own subscription payments" ON subscription_payments;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if tables don't exist
        NULL;
END $$;

-- Drop new tables if they already exist (from previous migration attempts)
DROP TABLE IF EXISTS subscribers CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Create the clean subscribers table (paid subscribers who subscribe to a creator)
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subscriber_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'banned')),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(creator_id, subscriber_id)
);

-- Create the clean subscriptions table (creators the user pays to subscribe to)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subscriber_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('monthly', 'yearly', 'one-time')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'past_due')),
  payment_id UUID,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  last_renewed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(creator_id, subscriber_id, type, started_at)
);

-- Create indexes for subscribers
CREATE INDEX idx_subscribers_creator_id ON subscribers(creator_id);
CREATE INDEX idx_subscribers_subscriber_id ON subscribers(subscriber_id);
CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_subscribers_last_interaction ON subscribers(last_interaction);
CREATE INDEX idx_subscribers_creator_status ON subscribers(creator_id, status);
CREATE INDEX idx_subscribers_subscriber_status ON subscribers(subscriber_id, status);

-- Create indexes for subscriptions
CREATE INDEX idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX idx_subscriptions_subscriber_id ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_type ON subscriptions(type);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);
CREATE INDEX idx_subscriptions_creator_status ON subscriptions(creator_id, status);
CREATE INDEX idx_subscriptions_subscriber_status ON subscriptions(subscriber_id, status);
CREATE INDEX idx_subscriptions_expires_status ON subscriptions(expires_at, status);

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscribers
CREATE POLICY "Creators can view their subscribers" ON subscribers
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can view their own subscriptions to creators" ON subscribers
  FOR SELECT USING (subscriber_id = auth.uid());

CREATE POLICY "Users can subscribe to creators" ON subscribers
  FOR INSERT WITH CHECK (subscriber_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions" ON subscribers
  FOR UPDATE USING (subscriber_id = auth.uid());

CREATE POLICY "Users can unsubscribe from creators" ON subscribers
  FOR DELETE USING (subscriber_id = auth.uid());

-- RLS Policies for subscriptions
CREATE POLICY "Creators can view their paid subscribers" ON subscriptions
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can view their own paid subscriptions" ON subscriptions
  FOR SELECT USING (subscriber_id = auth.uid());

CREATE POLICY "Users can create paid subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (subscriber_id = auth.uid());

CREATE POLICY "Users can update their own paid subscriptions" ON subscriptions
  FOR UPDATE USING (subscriber_id = auth.uid());

CREATE POLICY "Users can cancel their own paid subscriptions" ON subscriptions
  FOR DELETE USING (subscriber_id = auth.uid());

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
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

-- Create trigger for subscriptions timestamp
CREATE TRIGGER update_subscription_timestamp_trigger
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_timestamp();

-- Create trigger function to update last_interaction
CREATE OR REPLACE FUNCTION update_subscriber_interaction()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.last_interaction = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Create trigger for subscriber interaction
CREATE TRIGGER update_subscriber_interaction_trigger
    BEFORE UPDATE ON subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriber_interaction();

-- Create helper functions
CREATE OR REPLACE FUNCTION follow_creator(
    p_subscriber_id UUID,
    p_creator_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS subscribers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscriber subscribers;
BEGIN
    -- Validate inputs
    IF p_subscriber_id IS NULL OR p_creator_id IS NULL THEN
        RAISE EXCEPTION 'Subscriber ID and Creator ID are required';
    END IF;

    IF p_subscriber_id = p_creator_id THEN
        RAISE EXCEPTION 'Users cannot follow themselves';
    END IF;

    -- Insert or update subscriber
    INSERT INTO subscribers (
        creator_id,
        subscriber_id,
        notes
    ) VALUES (
        p_creator_id,
        p_subscriber_id,
        p_notes
    )
    ON CONFLICT (creator_id, subscriber_id) DO UPDATE SET
        status = 'active',
        last_interaction = NOW(),
        notes = COALESCE(EXCLUDED.notes, subscribers.notes)
    RETURNING * INTO v_subscriber;

    RETURN v_subscriber;
END;
$$;

CREATE OR REPLACE FUNCTION unfollow_creator(
    p_subscriber_id UUID,
    p_creator_id UUID
)
RETURNS subscribers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscriber subscribers;
BEGIN
    UPDATE subscribers SET
        status = 'unsubscribed',
        last_interaction = NOW()
    WHERE subscriber_id = p_subscriber_id AND creator_id = p_creator_id
    RETURNING * INTO v_subscriber;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription not found';
    END IF;

    RETURN v_subscriber;
END;
$$;

CREATE OR REPLACE FUNCTION create_paid_subscription(
    p_subscriber_id UUID,
    p_creator_id UUID,
    p_type TEXT,
    p_amount NUMERIC,
    p_currency TEXT DEFAULT 'USD',
    p_notes TEXT DEFAULT NULL
)
RETURNS subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription subscriptions;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Validate inputs
    IF p_subscriber_id IS NULL OR p_creator_id IS NULL OR p_type IS NULL OR p_amount IS NULL THEN
        RAISE EXCEPTION 'Subscriber ID, Creator ID, Type, and Amount are required';
    END IF;

    IF p_subscriber_id = p_creator_id THEN
        RAISE EXCEPTION 'Users cannot subscribe to themselves';
    END IF;

    -- Set expiration based on type
    CASE p_type
        WHEN 'monthly' THEN v_expires_at := NOW() + INTERVAL '1 month';
        WHEN 'yearly' THEN v_expires_at := NOW() + INTERVAL '1 year';
        WHEN 'one-time' THEN v_expires_at := NOW() + INTERVAL '1 year'; -- Default 1 year for one-time
        ELSE RAISE EXCEPTION 'Invalid subscription type';
    END CASE;

    -- Insert subscription
    INSERT INTO subscriptions (
        creator_id,
        subscriber_id,
        type,
        started_at,
        expires_at,
        amount,
        currency,
        notes
    ) VALUES (
        p_creator_id,
        p_subscriber_id,
        p_type,
        NOW(),
        v_expires_at,
        p_amount,
        p_currency,
        p_notes
    )
    RETURNING * INTO v_subscription;

    -- Also add to subscribers table if not already there
    INSERT INTO subscribers (creator_id, subscriber_id, notes)
    VALUES (p_creator_id, p_subscriber_id, p_notes)
    ON CONFLICT (creator_id, subscriber_id) DO UPDATE SET
        status = 'active',
        last_interaction = NOW();

    RETURN v_subscription;
END;
$$;

CREATE OR REPLACE FUNCTION cancel_paid_subscription(
    p_subscriber_id UUID,
    p_creator_id UUID
)
RETURNS subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription subscriptions;
BEGIN
    UPDATE subscriptions SET
        status = 'cancelled',
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE subscriber_id = p_subscriber_id AND creator_id = p_creator_id
    RETURNING * INTO v_subscription;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Paid subscription not found';
    END IF;

    RETURN v_subscription;
END;
$$;

-- Utility function to check if user has access to creator's premium content
CREATE OR REPLACE FUNCTION has_premium_access(
    p_subscriber_id UUID,
    p_creator_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_has_access BOOLEAN := FALSE;
BEGIN
    -- Check if user has an active paid subscription
    SELECT EXISTS(
        SELECT 1 FROM subscriptions 
        WHERE subscriber_id = p_subscriber_id 
        AND creator_id = p_creator_id 
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO v_has_access;
    
    RETURN v_has_access;
END;
$$;

-- Function to get subscription status for a user-creator pair
CREATE OR REPLACE FUNCTION get_subscription_status(
    p_subscriber_id UUID,
    p_creator_id UUID
)
RETURNS TABLE(
    is_following BOOLEAN,
    is_paid_subscriber BOOLEAN,
    subscription_type TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    amount NUMERIC,
    currency TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM subscribers WHERE subscriber_id = p_subscriber_id AND creator_id = p_creator_id AND status = 'active') as is_following,
        EXISTS(SELECT 1 FROM subscriptions WHERE subscriber_id = p_subscriber_id AND creator_id = p_creator_id AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())) as is_paid_subscriber,
        sub.type as subscription_type,
        sub.expires_at,
        sub.amount,
        sub.currency
    FROM subscriptions sub
    WHERE sub.subscriber_id = p_subscriber_id 
    AND sub.creator_id = p_creator_id 
    AND sub.status = 'active'
    AND (sub.expires_at IS NULL OR sub.expires_at > NOW())
    LIMIT 1;
END;
$$;

-- Create analytics view
CREATE OR REPLACE VIEW subscription_analytics WITH (security_invoker = on) AS
SELECT 
    u.id as user_id,
    u.username,
    u.wallet_address,
    -- As creator: total followers
    COUNT(DISTINCT s.subscriber_id) as total_followers,
    -- As creator: paid subscribers
    COUNT(DISTINCT sub.subscriber_id) as paid_subscribers,
    -- As creator: revenue
    COALESCE(SUM(sub.amount), 0) as total_revenue,
    -- As subscriber: creators followed
    COUNT(DISTINCT s2.creator_id) as creators_followed,
    -- As subscriber: paid subscriptions
    COUNT(DISTINCT sub2.creator_id) as paid_subscriptions,
    -- As subscriber: total spent
    COALESCE(SUM(sub2.amount), 0) as total_spent
FROM users u
LEFT JOIN subscribers s ON u.id = s.creator_id AND s.status = 'active'
LEFT JOIN subscriptions sub ON u.id = sub.creator_id AND sub.status = 'active'
LEFT JOIN subscribers s2 ON u.id = s2.subscriber_id AND s2.status = 'active'
LEFT JOIN subscriptions sub2 ON u.id = sub2.subscriber_id AND sub2.status = 'active'
GROUP BY u.id, u.username, u.wallet_address; 