#!/usr/bin/env node

/**
 * Environment variable validation script
 * Run with: node scripts/check-env.js
 */

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_SERVICE_ROLE'
];

const optionalVars = [
  'XION_TREASURY_CONTRACT_ADDRESS',
  'XION_RPC_URL',
  'XION_REST_URL',
  'CHAIN_ID',
  'COINGECKO_API_KEY'
];

// console.log('🔍 Checking environment variables...\n');

let allRequiredSet = true;

// Check required variables
// console.log('Required variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // console.log(`✅ ${varName}: SET`);
  } else {
    // console.log(`❌ ${varName}: NOT SET`);
    allRequiredSet = false;
  }
});

// console.log('\nOptional variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // console.log(`✅ ${varName}: SET`);
  } else {
    // console.log(`⚠️  ${varName}: NOT SET`);
  }
});

// console.log('\n' + '='.repeat(50));

if (allRequiredSet) {
  // console.log('🎉 All required environment variables are set!');
  
  // Test Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
    // console.log('⚠️  Warning: NEXT_PUBLIC_SUPABASE_URL doesn\'t look like a valid Supabase URL');
  }
  
  // console.log('\nYou can now run the development server with: npm run dev');
} else {
  // console.log('❌ Some required environment variables are missing.');
  // console.log('\nPlease create a .env.local file with the required variables.');
  // console.log('See ENVIRONMENT_SETUP.md for detailed instructions.');
  process.exit(1);
} 