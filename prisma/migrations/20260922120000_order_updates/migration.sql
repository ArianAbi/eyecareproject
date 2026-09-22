ALTER TABLE "OrderBatch"
ADD COLUMN "creditCharged" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "creditRefundedAt" TIMESTAMP(3);

ALTER TABLE "OrderUpdate"
ADD COLUMN "adminOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "readAt" TIMESTAMP(3),
ADD COLUMN "creditRefunded" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "OrderUpdate_orderBatchId_adminOnly_readAt_idx"
ON "OrderUpdate"("orderBatchId", "adminOnly", "readAt");
