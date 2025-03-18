import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const content = await prisma.content.findUnique({
      where: {
        id: params.id,
        status: 'PUBLISHED',
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 