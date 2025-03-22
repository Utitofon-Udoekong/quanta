import { Level, ContentType, ContentStatus, PricingModel } from '@prisma/client';

export { PricingModel };

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  metaAccountId: string | null;
  walletAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  isCreator: boolean;
  isAdmin: boolean;
}

export interface Metadata {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Article specific
  readTime: string | null;
  wordCount: number | null;
  excerpt: string | null;
  tags: string[];

  // Video specific
  duration: string | null;
  resolution: string | null;
  format: string | null;
  fps: number | null;
  bitrate: string | null;

  // Course specific
  chapterCount: number | null;
  level: Level | null;
  prerequisites: string[];
  syllabus: string[];

  // Software specific
  version: string | null;
  platform: string[];
  requirements: string[];
  features: string[];
  installGuide: string | null;

  // Relation to Content
  content?: Content | null;
}

export interface Content {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  status: ContentStatus;
  price: number;
  pricingModel: PricingModel;
  creatorId: string;
  creator: User;
  thumbnail: string | null;
  contentUrl: string | null;
  previewUrl: string | null;
  metadata: Metadata | null;
  metadataId: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Metrics
  viewCount: number;
  purchaseCount: number;
} 