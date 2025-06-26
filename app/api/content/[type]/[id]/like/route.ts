import { getSupabase } from '@/app/utils/supabase/client';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cookieName } from '@/app/utils/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
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

    const { type, id } = await params;
    const userId = user.id;

    //console.log('Like request:', { type, id, userId });

    // Check if like already exists
    const { data: existingLike, error: checkError } = await supabase
      .from('content_likes')
      .select('id')
      .eq('content_id', id)
      .eq('content_type', type)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing like:', checkError);
      throw checkError;
    }

    if (existingLike) {
      // Unlike if already liked
      const { error: deleteError } = await supabase
        .from('content_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error deleting like:', deleteError);
        throw deleteError;
      }
      return NextResponse.json({ liked: false });
    }

    // Create new like
    const { error: insertError } = await supabase
      .from('content_likes')
      .insert({
        content_id: id,
        content_type: type,
        user_id: userId
      });

    if (insertError) {
      console.error('Error inserting like:', insertError);
      throw insertError;
    }
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
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(cookieName)?.value;
    const supabase = await getSupabase(accessToken || '');
    const { type, id } = await params;

    // Get like count
    const { count, error: countError } = await supabase
      .from('content_likes')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', id)
      .eq('content_type', type);

    if (countError) {
      console.error('Error getting like count:', countError);
      throw countError;
    }

    // Get user's like status if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    let userLiked = false;

    if (user) {
      const { data: userLike, error: userLikeError } = await supabase
        .from('content_likes')
        .select('id')
        .eq('content_id', id)
        .eq('content_type', type)
        .eq('user_id', user.id)
        .single();

      if (userLikeError && userLikeError.code !== 'PGRST116') {
        console.error('Error checking user like:', userLikeError);
        throw userLikeError;
      }

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