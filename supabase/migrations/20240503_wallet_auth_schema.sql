-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing auth-related triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Modify users table for pure wallet authentication
ALTER TABLE users 
    DROP CONSTRAINT IF EXISTS users_id_fkey, -- Remove reference to auth.users
    ALTER COLUMN id TYPE TEXT, -- Change id to TEXT to store wallet address
    ALTER COLUMN wallet_address SET NOT NULL,
    ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address),
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS wallet_chain TEXT DEFAULT 'xion',
    ADD COLUMN IF NOT EXISTS wallet_metadata JSONB DEFAULT '{}'::jsonb;

-- Add check constraint for wallet_chain
ALTER TABLE users ADD CONSTRAINT valid_wallet_chain 
    CHECK (wallet_chain IN ('xion', 'cosmos', 'ethereum', 'solana'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users (wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_wallet_chain ON users (wallet_chain);

-- Add comments
COMMENT ON COLUMN users.wallet_address IS 'The user''s blockchain wallet address';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of the user''s last login';
COMMENT ON COLUMN users.wallet_chain IS 'The blockchain network the wallet belongs to';
COMMENT ON COLUMN users.wallet_metadata IS 'Additional metadata about the wallet';

-- Create function to validate wallet address format
CREATE OR REPLACE FUNCTION validate_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
    -- Basic validation for bech32 addresses (xion, cosmos)
    IF NEW.wallet_chain IN ('xion', 'cosmos') THEN
        IF NOT NEW.wallet_address ~ '^[a-zA-Z0-9]{39,45}$' THEN
            RAISE EXCEPTION 'Invalid wallet address format for % chain', NEW.wallet_chain;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate wallet address
DROP TRIGGER IF EXISTS validate_wallet_address_trigger ON users;
CREATE TRIGGER validate_wallet_address_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_wallet_address();

-- Create function to update last_login_at
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_login_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_login_at
DROP TRIGGER IF EXISTS update_user_last_login ON users;
CREATE TRIGGER update_user_last_login
    BEFORE UPDATE ON users
    FOR EACH ROW
    WHEN (OLD.wallet_address IS DISTINCT FROM NEW.wallet_address)
    EXECUTE FUNCTION update_last_login();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- Create new policies for wallet-based authentication
CREATE POLICY "Users can read their own data"
    ON users FOR SELECT
    USING (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address')
    WITH CHECK (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

CREATE POLICY "Users can insert their own data"
    ON users FOR INSERT
    WITH CHECK (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Update subscription_payments table to support blockchain transactions
ALTER TABLE subscription_payments
    ADD COLUMN IF NOT EXISTS transaction_hash TEXT,
    ADD COLUMN IF NOT EXISTS wallet_address TEXT,
    ADD COLUMN IF NOT EXISTS wallet_chain TEXT DEFAULT 'xion';

-- Add index for transaction hash lookups
CREATE INDEX IF NOT EXISTS idx_subscription_payments_transaction_hash 
    ON subscription_payments(transaction_hash);

-- Add index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_subscription_payments_wallet_address 
    ON subscription_payments(wallet_address);

-- Add comments for new columns
COMMENT ON COLUMN subscription_payments.transaction_hash IS 'The transaction hash from the blockchain for this payment';
COMMENT ON COLUMN subscription_payments.wallet_address IS 'The wallet address used for the payment';
COMMENT ON COLUMN subscription_payments.wallet_chain IS 'The blockchain network used for the payment';

-- Update RLS policies for subscription_payments
DROP POLICY IF EXISTS "Users can view their own subscription payments" ON subscription_payments;
DROP POLICY IF EXISTS "Users can insert their own subscription payments" ON subscription_payments;

CREATE POLICY "Users can view their own subscription payments"
    ON subscription_payments
    FOR SELECT
    USING (
        wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
    );

CREATE POLICY "Users can insert their own subscription payments"
    ON subscription_payments
    FOR INSERT
    WITH CHECK (
        wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
    ); 