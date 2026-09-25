CREATE TABLE "RateLimit" ("key" TEXT PRIMARY KEY, "count" INTEGER NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");
CREATE TABLE "ImageAsset" ("filename" TEXT PRIMARY KEY, "ownerId" TEXT NOT NULL, "size" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "ImageAsset_ownerId_createdAt_idx" ON "ImageAsset"("ownerId", "createdAt");

ALTER TABLE "OrderItem" ADD COLUMN "productSnapshot" JSONB;

ALTER TABLE "Invoice" ADD COLUMN "creditAppliedAt" TIMESTAMP(3);
UPDATE "Invoice" SET "creditAppliedAt" = COALESCE("paidAt", "updatedAt") WHERE "status" = 'PAID';
CREATE TABLE "PaymentAttempt" (
 "authority" TEXT PRIMARY KEY, "invoiceId" TEXT NOT NULL REFERENCES "Invoice"("id") ON DELETE RESTRICT,
 "status" TEXT NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "checkedAt" TIMESTAMP(3)
);
CREATE INDEX "PaymentAttempt_invoiceId_createdAt_idx" ON "PaymentAttempt"("invoiceId", "createdAt");
INSERT INTO "PaymentAttempt" ("authority", "invoiceId", "status", "createdAt")
 SELECT "zarinpalAuthority", "id", CASE WHEN "status" = 'PAID' THEN 'VERIFIED' ELSE 'PENDING' END, "updatedAt"
 FROM "Invoice" WHERE "zarinpalAuthority" IS NOT NULL;
