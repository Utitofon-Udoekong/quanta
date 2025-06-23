import { getSupabase } from '@/app/utils/supabase/client';
import { cookieName } from '@/app/utils/supabase';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
    const { content, parentId } = await request.json();
    const userId = user.id;

    console.log('Creating comment:', { type, id, userId, content, parentId });

    const { data: comment, error: insertError } = await supabase
      .from('content_comments')
      .insert({
        content_id: id,
        content_type: type,
        user_id: userId,
        content,
        parent_id: parentId || null
      })
      .select(`
        *,
        user:users (
          username,
          avatar_url,
          wallet_address
        )
      `)
      .single();

    if (insertError) {
      console.error('Error inserting comment:', insertError);
      throw insertError;
    }
    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
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
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    const supabase = await getSupabase(accessToken || '');
    const { type, id } = params;
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    const query = supabase
      .from('content_comments')
      .select(`
        *,
        user:users (
          username,
          avatar_url,
          wallet_address
        ),
        replies:content_comments (
          *,
          user:users (
            username,
            avatar_url,
            wallet_address
          )
        )
      `)
      .eq('content_id', id)
      .eq('content_type', type)
      .order('created_at', { ascending: true });

    if (parentId) {
      query.eq('parent_id', parentId);
    } else {
      query.is('parent_id', null);
    }

    const { data: comments, error } = await query;

    if (error) throw error;
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { commentId, content } = await request.json();
    const userId = user.id;

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const { data: comment, error: updateError } = await supabase
      .from('content_comments')
      .update({ content })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select(`
        *,
        user:users (
          username,
          avatar_url,
          wallet_address
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      throw updateError;
    }
    return NextResponse.json(comment);
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { commentId } = await request.json();
    const userId = user.id;

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    console.log('Deleting comment:', { commentId, userId });

    const { error: deleteError } = await supabase
      .from('content_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      throw deleteError;
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment', details: error.message },
      { status: 500 }
    );
  }
} 