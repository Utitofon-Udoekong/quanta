import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params;
    const body = await request.json();

    // Validate content type
    if (!['videos', 'audio', 'articles'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if the content exists and belongs to the user
    const { data: existingContent, error: fetchError } = await supabase
      .from(type)
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    if (existingContent.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this content' },
        { status: 403 }
      );
    }

    // Update the content
    const { data: updatedContent, error: updateError } = await supabase
      .from(type)
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      // console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update content' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedContent);

  } catch (error) {
    // console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 