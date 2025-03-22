import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { Content, Metadata, ContentType, ContentStatus } from '@prisma/client';

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

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Content & { metadata: Metadata }>>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const {
      title,
      description,
      type,
      price,
      pricingModel,
      creatorId,
      status,
      thumbnail,
      contentUrl,
      previewUrl,
      metadata,
    } = data;

    // Create metadata first
    const createdMetadata = await prisma.metadata.create({
      data: {
        ...metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create content with metadata reference
    const content = await prisma.content.create({
      data: {
        title,
        description,
        type,
        price,
        pricingModel,
        creatorId,
        status,
        thumbnail,
        contentUrl,
        previewUrl,
        metadataId: createdMetadata.id,
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