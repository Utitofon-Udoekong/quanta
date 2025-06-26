-- Migration: Create subscription_payments table for tracking payment attempts
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  payment_method TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  transaction_hash TEXT,
  wallet_address TEXT,
  wallet_chain TEXT DEFAULT 'xion-testnet-2'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_payment_date ON subscription_payments(payment_date);

-- Enable Row Level Security
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only allow access to payments for subscriptions the user owns
CREATE POLICY "Users can view their own subscription payments" ON subscription_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE subscriptions.id = subscription_payments.subscription_id 
      AND subscriptions.subscriber_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own subscription payments" ON subscription_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE subscriptions.id = subscription_payments.subscription_id 
      AND subscriptions.subscriber_id = auth.uid()
    )
  ); 