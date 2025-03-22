import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db/client';
import { Metadata } from '@/app/types/content';
import { ApiResponse } from '@/app/types/api';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse<ApiResponse<Metadata>>> {
  try {
    const body = await request.json();
    const {
      readTime,
      wordCount,
      duration,
      excerpt,
      tags,
      resolution,
      format,
      fps,
      bitrate,
      chapterCount,
      level,
      prerequisites,
      syllabus,
      platform,
      requirements,
      features,
      version,
      installGuide,
    } = body;

    // First find the content to get its metadata ID
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      select: { metadataId: true }
    });

    if (!content?.metadataId) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'No metadata found for this content'
        }
      }, { status: 404 });
    }

    const metadata = await prisma.metadata.update({
      where: {
        id: content.metadataId
      },
      data: {
        readTime,
        wordCount,
        duration,
        excerpt,
        tags,
        resolution,
        format,
        fps,
        bitrate,
        chapterCount,
        level,
        prerequisites,
        syllabus,
        platform,
        requirements,
        features,
        version,
        installGuide,
      }
    });

    return NextResponse.json({
      success: true,
      data: metadata,
      message: 'Metadata updated successfully'
    });
  } catch (error) {
    console.error('Error updating metadata:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to update metadata',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 