-- Fix subscription_analytics view to work with service role client
-- Change from security_invoker to security_definer to bypass RLS for analytics

DROP VIEW IF EXISTS subscription_analytics;

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