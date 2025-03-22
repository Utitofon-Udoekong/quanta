import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db/client';
import { Content } from '@/app/types/content';
import { ApiResponse } from '@/app/types/api';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse<ApiResponse<Content>>> {
  try {
    const content = await prisma.content.findUnique({
      where: {
        id: params.id
      },
      include: {
        creator: true,
        metadata: true,
      }
    });

    if (!content) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Content not found'
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: content,
      message: 'Content retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to fetch content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse<ApiResponse<Content>>> {
  try {
    const body = await request.json();
    const { title, description, type, price, thumbnail, contentUrl, previewUrl, status } = body;

    const content = await prisma.content.update({
      where: {
        id: params.id
      },
      data: {
        title,
        description,
        type,
        price,
        thumbnail,
        contentUrl,
        previewUrl,
        status,
      },
      include: {
        creator: true,
        metadata: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: content,
      message: 'Content updated successfully'
    });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to update content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams): Promise<NextResponse<ApiResponse<void>>> {
  try {
    await prisma.content.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to delete content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 