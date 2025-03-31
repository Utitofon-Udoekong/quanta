import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const userRef = doc(db, 'users', walletAddress);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    return NextResponse.json({
      id: walletAddress,
      name: userData.name,
      email: userData.email,
      walletAddress: userData.walletAddress,
      metaAccountId: userData.metaAccountId,
      isCreator: userData.isCreator,
      isAdmin: userData.isAdmin,
    });
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

    const userRef = doc(db, 'users', walletAddress);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Create new user
    await setDoc(userRef, {
      walletAddress,
      metaAccountId,
      name: name || `User ${walletAddress.slice(0, 6)}`,
      email: email || `${walletAddress.slice(0, 6)}@xion.user`,
      isCreator: false,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: walletAddress,
      name: name || `User ${walletAddress.slice(0, 6)}`,
      email: email || `${walletAddress.slice(0, 6)}@xion.user`,
      walletAddress,
      metaAccountId,
      isCreator: false,
      isAdmin: false,
    });
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

    const userRef = doc(db, 'users', walletAddress);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await updateDoc(userRef, {
      name,
      email,
      updatedAt: new Date().toISOString(),
    });

    const updatedUser = await getDoc(userRef);
    const userData = updatedUser.data();

    return NextResponse.json({
      id: walletAddress,
      name: userData.name,
      email: userData.email,
      walletAddress: userData.walletAddress,
      metaAccountId: userData.metaAccountId,
      isCreator: userData.isCreator,
      isAdmin: userData.isAdmin,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 