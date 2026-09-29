-- Keep all existing public blog images and their URLs while promoting the asset table
-- into the shared admin media library. Private ImageAsset rows remain separate.
ALTER TABLE "BlogImageAsset" RENAME TO "MediaAsset";
ALTER TABLE "MediaAsset" RENAME CONSTRAINT "BlogImageAsset_pkey" TO "MediaAsset_pkey";
ALTER INDEX "BlogImageAsset_ownerId_createdAt_idx" RENAME TO "MediaAsset_ownerId_createdAt_idx";
ALTER TABLE "MediaAsset" RENAME CONSTRAINT "BlogImageAsset_ownerId_fkey" TO "MediaAsset_ownerId_fkey";
ALTER TABLE "MediaAsset" ADD COLUMN "width" INTEGER;
ALTER TABLE "MediaAsset" ADD COLUMN "height" INTEGER;
ALTER TABLE "MediaAsset" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MediaAsset" ADD COLUMN "altText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MediaAsset" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MediaAsset" ADD COLUMN "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "MediaAsset" ADD COLUMN "blurDataUrl" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
