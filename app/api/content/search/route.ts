import { getSupabase } from '@/app/utils/supabase/client';
import { cookies } from 'next/headers';
import { cookieName } from '@/app/utils/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    const cookieStore = await cookies()
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    const supabase = await getSupabase(accessToken || '');

    // Search articles
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, excerpt, created_at, user_id, thumbnail_url')
      .ilike('title', `%${q}%`)
      .limit(limit);

    // Search videos
    const { data: videos } = await supabase
      .from('videos')
      .select('id, title, description, created_at, user_id, thumbnail_url')
      .ilike('title', `%${q}%`)
      .limit(limit);

    // Search audio
    const { data: audio } = await supabase
      .from('audio')
      .select('id, title, description, created_at, user_id, thumbnail_url')
      .ilike('title', `%${q}%`)
      .limit(limit);

    // Tag each result with its type
    const results = [
      ...(articles || []).map(a => ({ ...a, type: 'article' })),
      ...(videos || []).map(v => ({ ...v, type: 'video' })),
      ...(audio || []).map(a => ({ ...a, type: 'audio' })),
    ];

    // Sort by created_at descending
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Limit the total results
    return NextResponse.json(results.slice(0, limit));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to search content' },
      { status: 500 }
    );
  }
} 