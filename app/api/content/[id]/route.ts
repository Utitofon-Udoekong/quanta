import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { Content, Metadata } from '@prisma/client';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type ContentWithMetadata = Content & {
  metadata: Metadata | null;
  creator?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<ContentWithMetadata>>> {
  try {
    const content = await prisma.content.findUnique({
      where: { id: params.id },
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

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<ContentWithMetadata>>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { metadata, ...contentData } = data;

    // Update metadata if provided
    if (metadata) {
      await prisma.metadata.update({
        where: { id: data.metadataId },
        data: {
          ...metadata,
          updatedAt: new Date(),
        },
      });
    }

    // Update content
    const content = await prisma.content.update({
      where: { id: params.id },
      data: contentData,
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
    console.error('Error updating content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<void>>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get content to check if it has metadata
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      select: { metadataId: true },
    });

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    // Delete content first (due to foreign key constraint)
    await prisma.content.delete({
      where: { id: params.id },
    });

    // Delete metadata if it exists
    if (content.metadataId) {
      await prisma.metadata.delete({
        where: { id: content.metadataId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete content' },
      { status: 500 }
    );
  }
} 