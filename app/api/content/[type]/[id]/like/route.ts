import { getSupabase } from '@/app/utils/supabase/client';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cookieName } from '@/app/utils/supabase';

export async function POST(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    const supabase = await getSupabase(accessToken || '');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id } = params;
    const walletAddress = user.user_metadata.wallet_address;

    // Check if like already exists
    const { data: existingLike } = await supabase
      .from('content_likes')
      .select('id')
      .eq('content_id', id)
      .eq('content_type', type)
      .eq('user_id', walletAddress)
      .single();

    if (existingLike) {
      // Unlike if already liked
      const { error: deleteError } = await supabase
        .from('content_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) throw deleteError;
      return NextResponse.json({ liked: false });
    }

    // Create new like
    const { error: insertError } = await supabase
      .from('content_likes')
      .insert({
        content_id: id,
        content_type: type,
        user_id: walletAddress
      });

    if (insertError) throw insertError;
    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error('Error handling like:', error);
    return NextResponse.json(
      { error: 'Failed to process like' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(cookieName)?.value;
    const supabase = await getSupabase(accessToken || '');
    const { type, id } = params;

    // Get like count
    const { count, error: countError } = await supabase
      .from('content_likes')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', id)
      .eq('content_type', type);

    if (countError) throw countError;

    // Get user's like status if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    let userLiked = false;

    if (user) {
      const { data: userLike } = await supabase
        .from('content_likes')
        .select('id')
        .eq('content_id', id)
        .eq('content_type', type)
        .eq('user_id', user.user_metadata.wallet_address)
        .single();

      userLiked = !!userLike;
    }

    return NextResponse.json({
      likes: count || 0,
      userLiked
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
} 