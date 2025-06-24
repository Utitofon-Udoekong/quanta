-- Migration: Remove user_email and user_fullname from subscription_payments
ALTER TABLE subscription_payments
  DROP COLUMN IF EXISTS user_email,
  DROP COLUMN IF EXISTS user_fullname; 