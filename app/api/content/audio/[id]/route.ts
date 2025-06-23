import { getSupabase } from '@/app/utils/supabase/client';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cookieName } from '@/app/utils/supabase';

export const revalidate = 3600; // Revalidate every hour

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    const supabase = await getSupabase(accessToken || '');
    
    const { data: audio, error } = await supabase
      .from('audio')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(audio);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audio' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user_id, ...updateData } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies()
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    const supabase = await getSupabase(accessToken || '');

    // First verify the audio belongs to the user
    const { data: audio, error: fetchError } = await supabase
      .from('audio')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio not found' },
        { status: 404 }
      );
    }

    if (audio.user_id !== user_id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this audio' },
        { status: 403 }
      );
    }

    // Update the audio
    const { data: updatedAudio, error: updateError } = await supabase
      .from('audio')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedAudio);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update audio' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { published } = await request.json();

    if (typeof published !== 'boolean') {
      return NextResponse.json(
        { error: 'Published status must be a boolean' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    const supabase = await getSupabase(accessToken);

    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: audio, error: fetchError } = await supabase
      .from('audio')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !audio) {
      return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
    }

    if (audio.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the audio
    const { data: updatedAudio, error: updateError } = await supabase
      .from('audio')
      .update({ published })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedAudio);
  } catch (error: any) {
      return NextResponse.json(
      { error: error.message || 'Failed to update audio' },
      { status: 500 }
      );
  }
    }

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id:string }> }
) {
  try {
    const { id } = await params;
    
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    const supabase = await getSupabase(accessToken);
    
    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: audio, error: fetchError } = await supabase
      .from('audio')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !audio) {
      return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
    }

    if (audio.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the audio
    const { error: deleteError } = await supabase
      .from('audio')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete audio' },
      { status: 500 }
    );
  }
} 