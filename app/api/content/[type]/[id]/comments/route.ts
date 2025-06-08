import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id } = params;
    const { content, parentId } = await request.json();
    const walletAddress = user.user_metadata.wallet_address;

    const { data: comment, error: insertError } = await supabase
      .from('content_comments')
      .insert({
        content_id: id,
        content_type: type,
        user_id: walletAddress,
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

    if (insertError) throw insertError;
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
    const supabase = createRouteHandlerClient({ cookies });
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
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();
    const commentId = params.id;
    const walletAddress = user.user_metadata.wallet_address;

    const { data: comment, error: updateError } = await supabase
      .from('content_comments')
      .update({ content })
      .eq('id', commentId)
      .eq('user_id', walletAddress)
      .select(`
        *,
        user:users (
          username,
          avatar_url,
          wallet_address
        )
      `)
      .single();

    if (updateError) throw updateError;
    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = params.id;
    const walletAddress = user.user_metadata.wallet_address;

    const { error: deleteError } = await supabase
      .from('content_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', walletAddress);

    if (deleteError) throw deleteError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
} 