# Environment Setup

This project requires several environment variables to be configured properly for authentication and database connectivity.

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key

# Xion Blockchain Configuration
XION_TREASURY_CONTRACT_ADDRESS=your_treasury_address
XION_RPC_URL=your_xion_rpc_url
XION_REST_URL=your_xion_rest_url
CHAIN_ID=xion-testnet-2

# Optional
COINGECKO_API_KEY=your_coingecko_api_key
```

## Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - **Project URL**: Use this for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: Use this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret**: Use this for `SUPABASE_SERVICE_ROLE`
   - **JWT secret**: Use this for `SUPABASE_JWT_SECRET`

## Troubleshooting

### DNS Resolution Error
If you see `getaddrinfo ENOTFOUND` errors:
1. Verify your `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check that your Supabase project is active
3. Ensure you have internet connectivity

### Environment Variable Issues
1. Make sure all required variables are set
2. Restart your development server after adding environment variables
3. Check the debug endpoint: `/api/debug/env` (development only)

### Database Connection Issues
1. Verify your Supabase project is running
2. Check that your service role key has the correct permissions
3. Ensure your database schema is properly migrated

## Development vs Production

- In development, use `.env.local`
- In production, set environment variables in your hosting platform
- Never commit `.env.local` to version control 