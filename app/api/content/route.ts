import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db/client';
import { ContentType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const where = type ? { type: type as ContentType, status: 'PUBLISHED' } : { status: 'PUBLISHED' };

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where: {
          type: type as ContentType,
          status: 'PUBLISHED',
        },
        include: {
          creator: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.content.count({ where: {
          type: type as ContentType,
          status: 'PUBLISHED',
        },
      }),
    ]);

    return NextResponse.json({
      content,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
} 