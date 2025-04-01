import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: Request) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: content, error } = await supabase
      .from('content')
      .select(`
        *,
        creator:creator_id (id, full_name, email)
      `)
      .eq('creator_id', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching creator content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 