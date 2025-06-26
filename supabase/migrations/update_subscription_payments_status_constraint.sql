-- Migration: Update subscription_payments status check constraint to use 'completed' instead of 'succeeded'
-- First, update any existing 'succeeded' records to 'completed'
UPDATE subscription_payments 
SET status = 'completed' 
WHERE status = 'succeeded';

-- Drop the existing check constraint
ALTER TABLE subscription_payments 
DROP CONSTRAINT IF EXISTS subscription_payments_status_check;

-- Add the new check constraint with 'completed' instead of 'succeeded'
ALTER TABLE subscription_payments 
ADD CONSTRAINT subscription_payments_status_check 
CHECK (status IN ('completed', 'failed', 'pending', 'refunded'));

-- Add comment explaining the change
COMMENT ON COLUMN subscription_payments.status IS 'Payment status: completed, failed, pending, or refunded'; 