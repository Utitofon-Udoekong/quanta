-- Migration: Add payment reference and token type columns to subscription_payments table
ALTER TABLE subscription_payments 
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS token_type TEXT CHECK (token_type IN ('USDC', 'XION'));

-- Create index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_subscription_payments_reference ON subscription_payments(payment_reference);

-- Add comment explaining the column
COMMENT ON COLUMN subscription_payments.payment_reference IS 'NovyPay payment reference for tracking payment status';
COMMENT ON COLUMN subscription_payments.token_type IS 'Type of token used for payment (USDC or XION)'; 