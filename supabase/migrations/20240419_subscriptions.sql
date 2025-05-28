-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  plan_id TEXT NOT NULL, -- Changed from UUID reference to TEXT to match static plan IDs
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('succeeded', 'failed', 'pending')),
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE
);

-- Create subscription payments table
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  payment_method TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX subscriptions_user_id_idx ON subscriptions (user_id);
CREATE INDEX subscriptions_plan_id_idx ON subscriptions (plan_id);
CREATE INDEX subscriptions_status_idx ON subscriptions (status);
CREATE INDEX subscriptions_current_period_end_idx ON subscriptions (current_period_end);

CREATE INDEX subscription_payments_subscription_id_idx ON subscription_payments (subscription_id);
CREATE INDEX subscription_payments_status_idx ON subscription_payments (status);
CREATE INDEX subscription_payments_payment_date_idx ON subscription_payments (payment_date);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscription payments policies
CREATE POLICY "Users can view their own subscription payments" ON subscription_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.id = subscription_payments.subscription_id
      AND subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own subscription payments" ON subscription_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.id = subscription_payments.subscription_id
      AND subscriptions.user_id = auth.uid()
    )
  );

-- Insert default subscription plans
-- INSERT INTO subscription_plans (name, description, price, interval, features)
-- VALUES
--   ('Basic', 'Access to all free content', 0, 'month', '{"features": ["Access to all free content", "Basic support"]}'::jsonb),
--   ('Premium', 'Access to all premium content', 9.99, 'month', '{"features": ["Access to all free content", "Access to all premium content", "Priority support", "Ad-free experience"]}'::jsonb),
--   ('Pro', 'Access to all premium content and exclusive content', 19.99, 'month', '{"features": ["Access to all free content", "Access to all premium content", "Access to exclusive content", "Priority support", "Ad-free experience", "Early access to new content"]}'::jsonb),
--   ('Basic (Annual)', 'Access to all free content with annual discount', 0, 'year', '{"features": ["Access to all free content", "Basic support"]}'::jsonb),
--   ('Premium (Annual)', 'Access to all premium content with annual discount', 99.99, 'year', '{"features": ["Access to all free content", "Access to all premium content", "Priority support", "Ad-free experience"]}'::jsonb),
--   ('Pro (Annual)', 'Access to all premium content and exclusive content with annual discount', 199.99, 'year', '{"features": ["Access to all free content", "Access to all premium content", "Access to exclusive content", "Priority support", "Ad-free experience", "Early access to new content"]}'::jsonb); 