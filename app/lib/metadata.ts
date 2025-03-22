import { ContentType, Metadata } from '@prisma/client';

export const createMetadata = (type: ContentType, data: any): Partial<Metadata> => {
  // Convert URLs to keys if needed
  const baseMetadata = {
    thumbnailKey: data.thumbnail ? data.thumbnail.split('/').pop() : null,
    contentKey: data.contentUrl ? data.contentUrl.split('/').pop() : null,
    previewKey: data.previewUrl ? data.previewUrl.split('/').pop() : null,
  };

  switch (type) {
    case ContentType.VIDEO:
      return {
        ...baseMetadata,
        duration: data.duration || "00:00",
        resolution: data.resolution || "1920x1080",
        format: data.format || "mp4",
        fps: data.fps || 30,
        bitrate: data.bitrate || "5000kbps",
      };

    case ContentType.ARTICLE:
      return {
        ...baseMetadata,
        readTime: data.readTime || "5 min",
        wordCount: data.wordCount || 0,
        excerpt: data.excerpt || "",
        tags: data.tags || [],
      };

    case ContentType.COURSE:
      return {
        ...baseMetadata,
        chapterCount: data.chapterCount || 1,
        level: data.level || "BEGINNER",
        prerequisites: data.prerequisites || [],
        syllabus: data.syllabus || [],
      };

    case ContentType.SOFTWARE:
      return {
        ...baseMetadata,
        version: data.version || "1.0.0",
        platform: data.platform || [],
        requirements: data.requirements || [],
        features: data.features || [],
        installGuide: data.installGuide || "",
      };

    case ContentType.AUDIO:
      return {
        ...baseMetadata,
        duration: data.duration || "00:00",
        format: data.format || "mp3",
        bitrate: data.bitrate || "320kbps",
      };

    case ContentType.EBOOK:
      return {
        ...baseMetadata,
        format: data.format || "pdf",
      };

    default:
      return baseMetadata;
  }
}; 