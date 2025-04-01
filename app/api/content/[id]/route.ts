import { supabase } from '@/app/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: content, error } = await supabase
      .from('content')
      .select(`
        *,
        creator:creator_id (id, full_name, email)
      `)
      .eq('id', (await params).id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { title, description, type, price, thumbnail_url, content_url, status } = body;

    const { data: content, error } = await supabase
      .from('content')
      .update({
        title,
        description,
        type,
        price,
        thumbnail_url,
        content_url,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (await params).id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', (await params).id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
} 