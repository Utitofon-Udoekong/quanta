import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
    console.error('Error fetching content metadata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { data: account } = useAbstraxionAccount();
    if (!account?.bech32Address) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('creator_id')
      .eq('id', (await params).id)
      .single();

    if (contentError) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.creator_id !== account.bech32Address) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { data: updatedContent, error: updateError } = await supabase
      .from('content')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (await params).id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Error updating content metadata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 