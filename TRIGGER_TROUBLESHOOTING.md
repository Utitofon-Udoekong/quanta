# Auth Trigger Troubleshooting Guide

## Problem
The `on_auth_user_created` trigger is not creating user profiles in the `users` table when using `supabase.auth.admin.createUser()`.

## Common Causes

### 1. **Admin-created users don't always trigger events**
- `supabase.auth.admin.createUser()` sometimes bypasses normal auth events
- The trigger might not fire consistently with admin operations

### 2. **Metadata structure issues**
- The trigger expects `wallet_address` in `app_metadata` or `user_metadata`
- Incorrect metadata structure can cause the trigger to fail silently

### 3. **Database permissions**
- The trigger function needs proper permissions to insert into the `users` table
- RLS policies might be blocking the trigger

### 4. **Trigger function errors**
- Silent failures in the trigger function
- Missing error handling

## Solutions Implemented

### 1. **Improved Trigger Function**
The new trigger function in `supabase/migrations/fix-auth-trigger.sql`:
- Checks multiple metadata locations for wallet address
- Better error handling and logging
- More robust metadata extraction

### 2. **Fallback Mechanism**
The login route now includes a fallback:
- Waits 500ms for trigger to complete
- Checks if user profile was created
- Manually creates profile if trigger failed
- Logs the process for debugging

### 3. **Debug Endpoints**
- `/api/debug/env` - Check environment variables
- `/api/debug/trigger` - Test trigger functionality

## Testing the Fix

### 1. **Apply the migration**
```bash
# If using Supabase CLI
supabase db push

# Or run the SQL manually in your Supabase dashboard
```

### 2. **Test the trigger**
```bash
# Test with a wallet address
curl -X POST http://localhost:3000/api/debug/trigger \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "xion19h28u9q9e44xlgt99xz5shztsjuul96nh9rkkgnlrd4padn7zu5qdn8uvr"}'
```

### 3. **Check logs**
Look for these log messages:
- `Created user profile for wallet: [address]` - Trigger success
- `Trigger did not create user profile, creating manually...` - Fallback used
- `Manually created user profile: [user]` - Manual creation success

## Manual Database Checks

### 1. **Check if trigger exists**
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### 2. **Check trigger function**
```sql
SELECT * FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

### 3. **Test trigger manually**
```sql
-- Check if function works
SELECT public.handle_new_user();
```

### 4. **Check user creation**
```sql
-- Check auth.users
SELECT id, email, raw_app_meta_data, raw_user_meta_data 
FROM auth.users 
WHERE raw_app_meta_data->>'wallet_address' IS NOT NULL;

-- Check public.users
SELECT id, wallet_address, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;
```

## Environment Variables Check

Ensure these are set correctly:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_SERVICE_ROLE=your_service_role_key
```

## Common Issues and Fixes

### Issue: "Trigger not firing"
**Fix**: Apply the new migration and restart your app

### Issue: "Permission denied"
**Fix**: Check that the service role has proper permissions

### Issue: "Metadata not found"
**Fix**: Ensure wallet_address is in app_metadata or user_metadata

### Issue: "RLS blocking insert"
**Fix**: The trigger function uses SECURITY DEFINER to bypass RLS

## Monitoring

### 1. **Enable Supabase logs**
- Go to your Supabase dashboard
- Navigate to Logs > Database
- Look for trigger-related messages

### 2. **Check application logs**
- Monitor your Next.js application logs
- Look for trigger and manual creation messages

### 3. **Database monitoring**
- Check the `users` table for new entries
- Monitor auth.users for new registrations

## Fallback Strategy

If the trigger continues to fail:

1. **Use manual creation only**: Remove the trigger and always create profiles manually
2. **Use a different approach**: Create users directly in the `users` table first, then in `auth.users`
3. **Use Supabase Auth hooks**: Switch to client-side auth with proper sign-up flow

## Support

If issues persist:
1. Check Supabase status page
2. Review Supabase documentation on triggers
3. Check the Supabase community forums
4. Contact Supabase support if needed 