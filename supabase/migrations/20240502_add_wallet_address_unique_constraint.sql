-- Add unique constraint to wallet_address field in users table
ALTER TABLE users
ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);

-- Add a comment to explain the constraint
COMMENT ON CONSTRAINT unique_wallet_address ON users IS 'Ensures each wallet address can only be associated with one user account'; 