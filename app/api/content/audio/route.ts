import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cookieName } from '@/app/utils/supabase';
import { NextResponse } from 'next/server';

export const revalidate = 0;

// Helper to create a Supabase admin client for server-side operations
const createSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user token to get their ID securely
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const audioData = await request.json();

    // Security check: ensure the user ID from the token matches the payload
    if (audioData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: User ID mismatch' }, { status: 403 });
    }

    const { data, error } = await supabase.from('audio').insert(audioData).select().single();

    if (error) {
      console.error('Supabase POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create audio' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('user_id');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audio')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // If user_id is provided, filter by user_id
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: audio, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      audio,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audio' },
      { status: 500 }
    );
  }
} 