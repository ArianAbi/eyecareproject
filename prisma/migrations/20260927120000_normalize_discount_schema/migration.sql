-- Normalize discount values and limits while preserving discounts created with the
-- original percentage-only schema. Percentage values are converted to basis points.
CREATE TYPE "DiscountAmountType" AS ENUM ('PERCENT', 'FLAT');

ALTER TABLE "Discount"
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "amountType" "DiscountAmountType",
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "maxUses" INTEGER,
ADD COLUMN "updatedAt" TIMESTAMP(3),
ADD COLUMN "usedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "value" INTEGER;
ALTER TABLE "Discount"
ADD COLUMN "usersRestricted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "productsRestricted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Discount"
SET
  "amountType" = 'PERCENT',
  "value" = ROUND("percentage" * 100)::INTEGER,
  "usersRestricted" = "userLimited",
  "productsRestricted" = "productsLimited",
  "maxUses" = CASE
    WHEN "type" IN ('USAGE', 'USAGE_AND_EXPIRE') THEN NULLIF("usageAmount", 0)
    ELSE NULL
  END,
  "expiresAt" = CASE
    WHEN "type" = 'USAGE' THEN NULL
    ELSE "expiresAt"
  END,
  "updatedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "Discount"
ALTER COLUMN "amountType" SET NOT NULL,
ALTER COLUMN "value" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "description" SET DEFAULT '',
ALTER COLUMN "expiresAt" DROP NOT NULL;

ALTER TABLE "Discount"
DROP COLUMN "percentage",
DROP COLUMN "productsLimited",
DROP COLUMN "type",
DROP COLUMN "usageAmount",
DROP COLUMN "userLimited";

DROP TYPE "DiscountType";

CREATE TABLE "DiscountRedemption" (
  "id" TEXT NOT NULL,
  "discountId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderBatchId" TEXT NOT NULL,
  "amountApplied" INTEGER NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DiscountRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscountRedemption_orderBatchId_key"
ON "DiscountRedemption"("orderBatchId");

CREATE INDEX "DiscountRedemption_discountId_createdAt_idx"
ON "DiscountRedemption"("discountId", "createdAt");

CREATE INDEX "DiscountRedemption_userId_createdAt_idx"
ON "DiscountRedemption"("userId", "createdAt");

CREATE INDEX "Discount_expiresAt_idx" ON "Discount"("expiresAt");

ALTER TABLE "DiscountRedemption"
ADD CONSTRAINT "DiscountRedemption_discountId_fkey"
FOREIGN KEY ("discountId") REFERENCES "Discount"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DiscountRedemption"
ADD CONSTRAINT "DiscountRedemption_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DiscountRedemption"
ADD CONSTRAINT "DiscountRedemption_orderBatchId_fkey"
FOREIGN KEY ("orderBatchId") REFERENCES "OrderBatch"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
