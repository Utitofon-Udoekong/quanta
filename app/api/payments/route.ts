import { NextResponse } from 'next/server';
import { paymentService } from '@/app/lib/services/payment';
import { useUserStore } from '@/app/store/use-user-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toUserId, amount, contentId } = body;
    const user = useUserStore.getState().user;

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    if (!toUserId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payment = await paymentService.createPayment(user.id, toUserId, amount, contentId);
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const paymentId = searchParams.get('paymentId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (paymentId) {
      const status = await paymentService.getPaymentStatus(paymentId);
      return NextResponse.json({ status });
    }

    const history = await paymentService.getPaymentHistory(userId);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching payment data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, status } = body;

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payment = await paymentService.updatePaymentStatus(paymentId, status);
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 