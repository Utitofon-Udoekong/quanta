import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/app/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prefix = formData.get('prefix') as string;
    const walletAddress = request.nextUrl.searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate a unique path for the file
    const timestamp = Date.now();
    const path = `${prefix}/${walletAddress}/${timestamp}-${file.name}`;
    const storageRef = ref(storage, path);

    // Upload to Firebase Storage
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    return NextResponse.json({
      key: path,
      url: url
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function DELETE(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: 'No file key provided' },
        { status: 400 }
      );
    }

    const storageRef = ref(storage, key);
    await deleteObject(storageRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 