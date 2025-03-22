/*
  Warnings:

  - Made the column `metadataId` on table `Content` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_metadataId_fkey";

-- AlterTable
ALTER TABLE "Content" ALTER COLUMN "metadataId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
