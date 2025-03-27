import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress as string },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        metaAccountId: true,
        isCreator: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, metaAccountId, name, email } = body;

    if (!walletAddress || !metaAccountId) {
      return NextResponse.json({ error: 'Wallet address and meta account ID are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        walletAddress,
        metaAccountId,
        name: name || `User ${walletAddress.slice(0, 6)}`,
        email: email || `${walletAddress.slice(0, 6)}@xion.user`,
        isCreator: false,
        isAdmin: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        metaAccountId: true,
        isCreator: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, name, email } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { walletAddress },
      data: {
        name,
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        metaAccountId: true,
        isCreator: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 