import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cookieName } from '@/app/utils/supabase';

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
    // console.log('User:', user);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const videoData = await request.json();

    // Security check: ensure the user ID from the token matches the payload
    if (videoData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: User ID mismatch' }, { status: 403 });
    }

    const { data, error } = await supabase.from('videos').insert(videoData).select().single();

    if (error) {
      // console.error('Supabase POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify all subscribers of the creator about the new video
    const { data: subscribers } = await supabase
      .from('subscribers')
      .select('subscriber_id')
      .eq('creator_id', videoData.user_id)
      .eq('status', 'active');

    for (const sub of subscribers || []) {
      await supabase.from('notifications').insert({
        user_id: sub.subscriber_id,
        type: 'new_content',
        message: `New video published: ${data.title}`,
        data: { contentId: data.id, contentType: 'video', title: data.title },
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    // console.error('API POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create video' }, { status: 500 });
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
      .from('videos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: videos, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      videos,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch videos' },
      { status: 500 }
    );
  }
} 