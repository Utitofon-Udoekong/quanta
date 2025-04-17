import { supabase } from '@/app/old/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<any[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const creatorId = searchParams.get('creatorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('content')
      .select(`
        *,
        creator:creator_id (id, full_name, email)
      `, { count: 'exact' })
      .eq('status', 'PUBLISHED');

    if (type) {
      query = query.eq('type', type);
    }

    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    const { data: content, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: content,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await request.json();
    const { title, description, type, price, creator_id, thumbnail_url, content_url } = body;

    const { data: content, error } = await supabase
      .from('content')
      .insert([{
        title,
        description,
        type,
        price,
        creator_id,
        thumbnail_url,
        content_url,
        status: 'DRAFT',
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create content' },
      { status: 500 }
    );
  }
} 