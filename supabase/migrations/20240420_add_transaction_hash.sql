-- Add transaction_hash column to subscription_payments table
ALTER TABLE subscription_payments
ADD COLUMN transaction_hash TEXT;

-- Add comment to the column
COMMENT ON COLUMN subscription_payments.transaction_hash IS 'The transaction hash from the blockchain for this payment';

-- Update RLS policies to include the new column
ALTER POLICY "Users can view their own subscription payments" 
ON subscription_payments 
USING (
  subscription_id IN (
    SELECT id FROM subscriptions 
    WHERE user_id = auth.uid()
  )
);

-- Add index for faster lookups by transaction hash
CREATE INDEX idx_subscription_payments_transaction_hash 
ON subscription_payments(transaction_hash); 