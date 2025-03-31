import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<any[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const creatorId = searchParams.get('creatorId');
    const status = searchParams.get('status');

    let q = collection(db, 'content');

    // Apply filters
    if (type) q = query(q, where('type', '==', type));
    if (creatorId) q = query(q, where('creatorId', '==', creatorId));
    if (status) q = query(q, where('status', '==', status));

    // Add ordering
    q = query(q, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const content = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const data = await request.json();
    const {
      title,
      description,
      type,
      price,
      pricingModel,
      status,
      creatorId,
      thumbnailUrl,
      contentUrl,
      duration,
    } = data;

    // Validate required fields
    if (!title || !description || !type || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate content type
    const validTypes = ['VIDEO', 'AUDIO', 'COURSE'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Validate pricing model
    const validPricingModels = ['FREE', 'PER_USE', 'PER_MINUTE', 'CUSTOM'];
    if (!validPricingModels.includes(pricingModel)) {
      return NextResponse.json(
        { error: 'Invalid pricing model' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Create content
    const contentRef = await addDoc(collection(db, 'content'), {
      title,
      description,
      type,
      price: price || 0,
      pricingModel: pricingModel || 'FREE',
      status: status || 'DRAFT',
      creatorId,
      thumbnailUrl,
      contentUrl,
      duration: duration || 0,
      viewCount: 0,
      purchaseCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const contentDoc = await getDoc(contentRef);
    const contentData = contentDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        id: contentRef.id,
        ...contentData,
        createdAt: contentData.createdAt?.toDate().toISOString(),
        updatedAt: contentData.updatedAt?.toDate().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 