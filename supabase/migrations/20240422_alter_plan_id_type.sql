-- First, drop the existing function
DROP FUNCTION IF EXISTS create_subscription(UUID, UUID, VARCHAR, JSONB);

-- Alter the subscriptions table to change plan_id type
ALTER TABLE subscriptions 
    ALTER COLUMN plan_id TYPE VARCHAR(50);

-- Recreate the function with the new parameter type
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
    v_amount DECIMAL(10,2);
    v_currency VARCHAR(3);
    v_status VARCHAR(20);
    v_payment_status VARCHAR(20);
BEGIN
    -- Validate required fields
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
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
            updated_at
        )
        VALUES (
            p_user_id,
            p_plan_id,
            v_status,
            (p_subscription_data->>'current_period_start')::TIMESTAMP WITH TIME ZONE,
            (p_subscription_data->>'current_period_end')::TIMESTAMP WITH TIME ZONE,
            p_payment_method,
            v_payment_status,
            CURRENT_TIMESTAMP,
            (p_subscription_data->>'current_period_end')::TIMESTAMP WITH TIME ZONE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
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
            updated_at
        )
        VALUES (
            v_subscription.id,
            v_amount,
            v_currency,
            v_payment_status,
            p_payment_method,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        RETURNING id INTO v_payment_id;

        RETURN v_subscription;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to create subscription: %', SQLERRM;
    END;
END;
$$; 