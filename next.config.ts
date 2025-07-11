import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'robohash.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  env: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseJWTSecret: process.env.SUPABASE_JWT_SECRET,
    supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE,
    treasuryAddress: process.env.XION_TREASURY_CONTRACT_ADDRESS,
    rpcUrl: process.env.XION_RPC_URL,
    restUrl: process.env.XION_REST_URL,
    chainId: process.env.CHAIN_ID,
    coingeckoApiKey: process.env.COINGECKO_API_KEY,
    novypayApiKey: process.env.NOVYPAY_API_KEY,
  },
};

export default nextConfig;
