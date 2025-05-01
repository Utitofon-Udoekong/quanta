import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 3600; // Revalidate every hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('user_id');
    const offset = (page - 1) * limit;

    const supabase = await createClient();
    
    let query = supabase
      .from('videos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // If user_id is provided, filter by user_id
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: videos, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
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