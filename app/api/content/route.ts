import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db/client';
import { Content } from '@/app/types/content';
import { ApiResponse } from '@/app/types/api';

export async function GET(): Promise<NextResponse<ApiResponse<Content[]>>> {
  try {
    const content = await prisma.content.findMany({
      where: {
        status: 'PUBLISHED'
      },
      include: {
        creator: true,
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

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

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Content>>> {
  try {
    const body = await request.json();
    const { title, description, type, price, creatorId, thumbnail, contentUrl, previewUrl } = body;

    const content = await prisma.content.create({
      data: {
        title,
        description,
        type,
        price,
        creatorId,
        thumbnail,
        contentUrl,
        previewUrl,
      },
      include: {
        creator: true,
        metadata: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: content,
      message: 'Content created successfully'
    });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to create content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 