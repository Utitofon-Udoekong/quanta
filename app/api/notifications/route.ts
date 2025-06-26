import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/app/utils/supabase/client';
import { cookies } from 'next/headers';
import { cookieName } from '@/app/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token found' }, { status: 401 });
    }
    const supabase = await getSupabase(accessToken);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ notifications: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No notification IDs provided' }, { status: 400 });
    }
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token found' }, { status: 401 });
    }
    const supabase = await getSupabase(accessToken);
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', ids);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update notifications' }, { status: 500 });
  }
} 