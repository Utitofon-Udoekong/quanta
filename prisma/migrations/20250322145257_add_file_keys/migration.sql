-- AlterEnum
ALTER TYPE "PricingModel" ADD VALUE 'FREE';

-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN     "contentKey" TEXT,
ADD COLUMN     "previewKey" TEXT,
ADD COLUMN     "thumbnailKey" TEXT;
