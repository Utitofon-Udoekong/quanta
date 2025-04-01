import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";

export async function POST(request: Request) {
  try {
    const { data: account } = useAbstraxionAccount();
    if (!account?.bech32Address) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId, price, creatorId } = await request.json();

    const { data: paymentIntent, error } = await supabase
      .from('payment_intents')
      .insert([{
        content_id: contentId,
        amount: price,
        currency: 'USD',
        status: 'PENDING',
        creator_id: creatorId,
        user_id: account.bech32Address,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ paymentIntentId: paymentIntent.id });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 