import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";

export async function GET() {
  try {
    const { data: account } = useAbstraxionAccount();
    if (!account?.bech32Address) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: content, error } = await supabase
      .from('content')
      .select(`
        *,
        creator:creator_id (id, full_name, email)
      `)
      .eq('creator_id', account.bech32Address)
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