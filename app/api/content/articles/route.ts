import { NextResponse } from 'next/server';
import { getSupabase } from '@/app/utils/supabase/client';
import { cookies } from 'next/headers';
import { cookieName } from '@/app/utils/supabase';

export const revalidate = 3600; // Revalidate every hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('user_id');
    const offset = (page - 1) * limit;

    const cookieStore = await cookies()
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    const supabase = await getSupabase(accessToken || '');

    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // If user_id is provided, filter by user_id
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: articles, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      articles,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch articles' },
      { status: 500 }
    );
  }
} 