import { ContentType, Metadata } from '@prisma/client';

interface BaseMetadataInput {
  thumbnail?: string;
  contentUrl?: string;
}

export function createMetadata(
  type: ContentType,
  data: BaseMetadataInput
): Partial<Metadata> {
  const baseMetadata = {
    thumbnailKey: data.thumbnail ? data.thumbnail.split('/').pop() : null,
    contentKey: data.contentUrl ? data.contentUrl.split('/').pop() : null,
  };

  switch (type) {
    case 'ARTICLE':
      return {
        ...baseMetadata,
        readTime: '5 min',
        wordCount: 0,
        excerpt: '',
        tags: [],
      };
    case 'VIDEO':
      return {
        ...baseMetadata,
        duration: '00:00',
        resolution: '1920x1080',
        format: 'mp4',
        fps: 30,
        bitrate: '2Mbps',
      };
    case 'COURSE':
      return {
        ...baseMetadata,
        chapterCount: 0,
        level: 'BEGINNER',
        prerequisites: [],
        syllabus: [],
      };
    case 'SOFTWARE':
      return {
        ...baseMetadata,
        version: '1.0.0',
        platform: [],
        requirements: [],
        features: [],
        installGuide: '',
      };
    case 'AUDIO':
      return {
        ...baseMetadata,
        duration: '00:00',
        format: 'mp3',
        bitrate: '128kbps',
      };
    case 'EBOOK':
      return {
        ...baseMetadata,
        format: 'pdf',
      };
    default:
      return baseMetadata;
  }
} 