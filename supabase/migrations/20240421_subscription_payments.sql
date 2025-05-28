-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_payment_date ON subscription_payments(payment_date);

-- Enable Row Level Security
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscription payments" ON subscription_payments;
DROP POLICY IF EXISTS "Users can insert their own subscription payments" ON subscription_payments;

-- Create policies
CREATE POLICY "Users can view their own subscription payments"
    ON subscription_payments
    FOR SELECT
    USING (
        subscription_id IN (
            SELECT id FROM subscriptions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own subscription payments"
    ON subscription_payments
    FOR INSERT
    WITH CHECK (
        subscription_id IN (
            SELECT id FROM subscriptions WHERE user_id = auth.uid()
        )
    );

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS renew_subscription(UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS create_subscription(UUID, UUID, VARCHAR, JSONB);

-- Create stored procedure for subscription renewal
CREATE OR REPLACE FUNCTION renew_subscription(
    p_subscription_id UUID,
    p_user_id UUID,
    p_renewal_data JSONB
)
RETURNS subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription subscriptions;
    v_payment_id UUID;
BEGIN
    -- Verify subscription exists and belongs to user
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE id = p_subscription_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription not found or unauthorized';
    END IF;

    -- Begin transaction
    BEGIN
        -- Update subscription
        UPDATE subscriptions
        SET
            current_period_start = (p_renewal_data->>'current_period_start')::TIMESTAMP WITH TIME ZONE,
            current_period_end = (p_renewal_data->>'current_period_end')::TIMESTAMP WITH TIME ZONE,
            payment_method = p_renewal_data->>'payment_method',
            payment_status = p_renewal_data->>'payment_status',
            last_payment_date = CURRENT_TIMESTAMP,
            next_payment_date = (p_renewal_data->>'current_period_end')::TIMESTAMP WITH TIME ZONE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_subscription_id
        RETURNING * INTO v_subscription;

        -- Create payment record
        INSERT INTO subscription_payments (
            subscription_id,
            amount,
            currency,
            status,
            payment_method
        )
        VALUES (
            p_subscription_id,
            (p_renewal_data->>'amount')::DECIMAL,
            COALESCE(p_renewal_data->>'currency', 'USD'),
            p_renewal_data->>'payment_status',
            p_renewal_data->>'payment_method'
        )
        RETURNING id INTO v_payment_id;

        RETURN v_subscription;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to renew subscription: %', SQLERRM;
    END;
END;
$$;

-- Create stored procedure for initial subscription creation
CREATE OR REPLACE FUNCTION create_subscription(
    p_user_id UUID,
    p_plan_id VARCHAR(50),
    p_payment_method VARCHAR(50),
    p_subscription_data JSONB
)
RETURNS subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription subscriptions;
    v_payment_id UUID;
BEGIN
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
            next_payment_date
        )
        VALUES (
            p_user_id,
            p_plan_id,
            p_subscription_data->>'status',
            (p_subscription_data->>'current_period_start')::TIMESTAMP WITH TIME ZONE,
            (p_subscription_data->>'current_period_end')::TIMESTAMP WITH TIME ZONE,
            p_payment_method,
            p_subscription_data->>'payment_status',
            CURRENT_TIMESTAMP,
            (p_subscription_data->>'current_period_end')::TIMESTAMP WITH TIME ZONE
        )
        RETURNING * INTO v_subscription;

        -- Create initial payment record
        INSERT INTO subscription_payments (
            subscription_id,
            amount,
            currency,
            status,
            payment_method
        )
        VALUES (
            v_subscription.id,
            (p_subscription_data->>'amount')::DECIMAL,
            COALESCE(p_subscription_data->>'currency', 'USD'),
            p_subscription_data->>'payment_status',
            p_payment_method
        )
        RETURNING id INTO v_payment_id;

        RETURN v_subscription;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to create subscription: %', SQLERRM;
    END;
END;
$$; 