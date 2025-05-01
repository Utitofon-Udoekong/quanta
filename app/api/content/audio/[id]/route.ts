import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 3600; // Revalidate every hour

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: audio, error } = await supabase
      .from('audio')
      .select('*')
      .eq('id', params.id)
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { user_id, ...updateData } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

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
        { error: 'Unauthorized to delete this audio' },
        { status: 403 }
      );
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