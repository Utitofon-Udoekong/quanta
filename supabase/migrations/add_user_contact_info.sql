-- Migration to add contact information columns to users table
-- This adds email, phone, and address fields for payment processing

-- Add email column
ALTER TABLE users ADD COLUMN email TEXT;

-- Add phone number columns
ALTER TABLE users ADD COLUMN phone_country_code TEXT;
ALTER TABLE users ADD COLUMN phone_number TEXT;

-- Add address columns
ALTER TABLE users ADD COLUMN address_line1 TEXT;
ALTER TABLE users ADD COLUMN address_line2 TEXT;
ALTER TABLE users ADD COLUMN city TEXT;
ALTER TABLE users ADD COLUMN state TEXT;
ALTER TABLE users ADD COLUMN country TEXT;
ALTER TABLE users ADD COLUMN postal_code TEXT;

-- Add indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);

-- Update RLS policies to allow users to update their own contact info
CREATE POLICY "Users can update their own contact information" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update the handle_new_user function to include email and random username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  wallet_addr TEXT;
  user_email TEXT;
  random_username TEXT;
  username_exists BOOLEAN;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 5;
BEGIN
  -- Extract wallet address from app_metadata
  wallet_addr := NEW.raw_app_meta_data->>'wallet_address';
  
  -- Extract email from user_metadata
  user_email := NEW.raw_user_meta_data->>'email';
  
  -- Generate a random username with timestamp to reduce collisions
  random_username := 'user_' || SUBSTRING(wallet_addr FROM 1 FOR 8) || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT % 10000;
  
  -- Check if username already exists and generate a new one if needed (max 5 attempts)
  LOOP
    SELECT EXISTS(SELECT 1 FROM users WHERE username = random_username) INTO username_exists;
    IF NOT username_exists OR attempt_count >= max_attempts THEN
      EXIT;
    END IF;
    attempt_count := attempt_count + 1;
    random_username := 'user_' || SUBSTRING(wallet_addr FROM 1 FOR 8) || '_' || (EXTRACT(EPOCH FROM NOW())::BIGINT + attempt_count) % 10000;
  END LOOP;
  
  -- If we still have a collision after max attempts, use a more unique approach with random suffix
  IF username_exists THEN
    random_username := 'user_' || SUBSTRING(wallet_addr FROM 1 FOR 8) || '_' || FLOOR(RANDOM() * 999999)::TEXT;
  END IF;
  
  -- Only create profile if wallet_address exists in app_metadata
  IF wallet_addr IS NOT NULL THEN
    INSERT INTO public.users (
      id,
      wallet_address,
      wallet_chain,
      wallet_metadata,
      username,
      email,
      created_at,
      updated_at,
      last_login_at,
      avatar_url
    )
    VALUES (
      NEW.id,
      wallet_addr,
      COALESCE(NEW.raw_app_meta_data->>'chain', 'xion-testnet-2'),
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      random_username,
      user_email,
      NOW(),
      NOW(),
      NOW(), -- Set initial login time
      'https://robohash.org/' || LEFT(wallet_addr, 8) || '?set=set4&size=200x200'
    )
    ON CONFLICT (wallet_address) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, users.email),
      last_login_at = NOW(),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add comment for documentation
COMMENT ON COLUMN users.email IS 'User email address for payment processing and notifications';
COMMENT ON COLUMN users.phone_country_code IS 'Country code for phone number (e.g., +1 for US)';
COMMENT ON COLUMN users.phone_number IS 'User phone number for payment processing';
COMMENT ON COLUMN users.address_line1 IS 'Primary address line for payment processing';
COMMENT ON COLUMN users.address_line2 IS 'Secondary address line (apartment, suite, etc.)';
COMMENT ON COLUMN users.city IS 'City for payment processing';
COMMENT ON COLUMN users.state IS 'State/province for payment processing';
COMMENT ON COLUMN users.country IS 'Country code for payment processing';
COMMENT ON COLUMN users.postal_code IS 'Postal/ZIP code for payment processing'; 