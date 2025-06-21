-- Fix auth trigger to work with admin-created users
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  wallet_addr TEXT;
  chain_val TEXT;
  user_meta JSONB;
BEGIN
  -- Extract wallet address from app_metadata (try multiple possible locations)
  wallet_addr := COALESCE(
    NEW.raw_app_meta_data->>'wallet_address',
    NEW.raw_user_meta_data->>'wallet_address',
    NEW.raw_user_meta_data->>'address'
  );
  
  -- Extract chain from app_metadata
  chain_val := COALESCE(
    NEW.raw_app_meta_data->>'chain',
    'xion-testnet-2'
  );
  
  -- Extract user metadata
  user_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  
  -- Only create profile if wallet_address exists
  IF wallet_addr IS NOT NULL AND wallet_addr != '' THEN
    INSERT INTO public.users (
      id,
      wallet_address,
      wallet_chain,
      wallet_metadata,
      created_at,
      updated_at,
      last_login_at,
      avatar_url
    )
    VALUES (
      NEW.id,
      wallet_addr,
      chain_val,
      user_meta,
      NOW(),
      NOW(),
      NOW(),
      'https://robohash.org/' || LEFT(wallet_addr, 8) || '?set=set4&size=200x200'
    )
    ON CONFLICT (wallet_address) DO UPDATE SET
      last_login_at = NOW(),
      updated_at = NOW(),
      wallet_metadata = EXCLUDED.wallet_metadata;
      
    -- Log successful creation
    RAISE NOTICE 'Created user profile for wallet: %', wallet_addr;
  ELSE
    -- Log when wallet address is missing
    RAISE WARNING 'No wallet address found in metadata for user %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to manually create user profile (fallback)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_wallet_address TEXT,
  p_chain TEXT DEFAULT 'xion-testnet-2',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    wallet_address,
    wallet_chain,
    wallet_metadata,
    created_at,
    updated_at,
    last_login_at,
    avatar_url
  )
  VALUES (
    p_user_id,
    p_wallet_address,
    p_chain,
    p_metadata,
    NOW(),
    NOW(),
    NOW(),
    'https://robohash.org/' || LEFT(p_wallet_address, 8) || '?set=set4&size=200x200'
  )
  ON CONFLICT (wallet_address) DO UPDATE SET
    last_login_at = NOW(),
    updated_at = NOW(),
    wallet_metadata = EXCLUDED.wallet_metadata;
    
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile manually: %', SQLERRM;
    RETURN FALSE;
END;
$$; 