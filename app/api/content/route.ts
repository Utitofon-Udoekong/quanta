import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { ContentType, ContentStatus, PricingModel } from '@prisma/client';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Content[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const creatorId = searchParams.get('creatorId');
    const status = searchParams.get('status');
    const content = await prisma.content.findMany({
      where: {
        ...(type && { type: type as ContentType }),
        ...(creatorId && { creatorId }),
        ...(status && { status: status as ContentStatus }),
      },
      include: {
        metadata: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Content & { metadata: Metadata }>>> {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const data = await request.json();
    const { title, description, type, price, pricingModel, thumbnail, contentUrl, metadata } = data;

    // Create metadata first
    const createdMetadata = await prisma.metadata.create({
      data: {
        ...metadata,
      },
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
        creatorId: user.id,
        thumbnail,
        contentUrl,
        metadataId: createdMetadata.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        metadata: true,
      },
    });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create content' },
      { status: 500 }
    );
  }
} 