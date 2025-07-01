import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cookieName } from '@/app/utils/supabase';

// Helper to create a Supabase admin client for server-side operations
const createSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;

    console.log('Auth test: Cookie name:', cookieName);
    console.log('Auth test: All cookies:', Array.from(cookieStore.getAll()).map(c => c.name));
    console.log('Auth test: Access token present:', !!accessToken);
    console.log('Auth test: Access token length:', accessToken?.length || 0);

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token found',
        cookies: Array.from(cookieStore.getAll()).map(c => c.name)
      }, { status: 401 });
    }

    // Verify the user token
    const supabase = createSupabaseAdmin();
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError) {
      console.error('Auth test: Token validation error:', userError);
      return NextResponse.json({ error: 'Invalid token', details: userError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'No user found for token' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        wallet_address: user.app_metadata?.wallet_address
      }
    });

  } catch (error: any) {
    console.error('Auth test: Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Authentication test failed' 
    }, { status: 500 });
  }
} 