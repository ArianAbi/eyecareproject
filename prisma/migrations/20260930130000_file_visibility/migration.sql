CREATE TYPE "UploadVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
ALTER TABLE "ImageAsset" ADD COLUMN "visibility" "UploadVisibility" NOT NULL DEFAULT 'PRIVATE';
ALTER TABLE "ImageAsset" ADD COLUMN "mimeType" TEXT NOT NULL DEFAULT 'image/webp';
ALTER TABLE "ImageAsset" ADD COLUMN "originalName" TEXT NOT NULL DEFAULT '';
CREATE INDEX "ImageAsset_visibility_createdAt_idx" ON "ImageAsset"("visibility", "createdAt");
