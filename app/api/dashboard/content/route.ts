import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db/client';
import { Content } from '@prisma/client';

export async function GET(request: Request): Promise<NextResponse<Content[] | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    const content = await prisma.content.findMany({
      where: {
        creatorId: creatorId
      },
      include: {
        creator: true,
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(content as Content[]);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
} 