import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db/client';

export async function POST(request: Request) {
  try {
    const { contentId, price, creatorId } = await request.json();

    // Create payment intent in database
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        contentId,
        amount: price,
        currency: 'USD',
        status: 'PENDING',
        creatorId,
      },
    });

    return NextResponse.json({ paymentIntentId: paymentIntent.id });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 