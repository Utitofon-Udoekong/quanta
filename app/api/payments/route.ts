import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const walletAddress = headersList.get('x-wallet-address');
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId, amount, contentId } = body;

    if (!toUserId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        from_user_id: walletAddress,
        to_user_id: toUserId,
        content_id: contentId,
        amount,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const walletAddress = headersList.get('x-wallet-address');
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (paymentId) {
      const { data: payment, error } = await supabase
        .from('payments')
        .update({ 
          status: 'COMPLETED',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ status: payment.status });
    }

    const { data: history, error } = await supabase
      .from('payments')
      .select(`
        *,
        from_user:from_user_id (wallet_address, full_name),
        to_user:to_user_id (wallet_address, full_name),
        content:content_id (title, type)
      `)
      .or(`from_user_id.eq.${walletAddress},to_user_id.eq.${walletAddress}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching payment data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const headersList = await headers();
    const walletAddress = headersList.get('x-wallet-address');
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, status } = body;

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 