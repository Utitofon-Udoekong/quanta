import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db/client';
import { Content, Metadata, ContentType, ContentStatus, PricingModel } from '@prisma/client';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Content[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    const content = await prisma.content.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Content & { metadata: Metadata }>>> {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, type, price, pricingModel, thumbnail, contentUrl, metadata } = body;

    // Create metadata first
    const createdMetadata = await prisma.metadata.create({
      data: metadata,
    });

    // Create content with metadata
    const content = await prisma.content.create({
      data: {
        title,
        description,
        type: type as ContentType,
        price,
        pricingModel: pricingModel as PricingModel,
        status: ContentStatus.DRAFT,
        creatorId: walletAddress,
        thumbnail,
        contentUrl,
        metadataId: createdMetadata.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
        metadata: true,
      },
    });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 