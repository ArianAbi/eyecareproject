CREATE TYPE "CreditTransactionType" AS ENUM ('INVOICE', 'ORDER', 'REFUND', 'DAILY_FEE', 'ADJUSTMENT', 'OPENING_BALANCE');
CREATE TABLE "CreditTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "CreditTransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER,
  "description" TEXT NOT NULL,
  "referenceId" TEXT,
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CreditTransaction_userId_createdAt_id_idx" ON "CreditTransaction"("userId", "createdAt", "id");
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Reconstruct historical movements from persisted receipts. An opening row reconciles
-- balances that predate available receipts; it is explicitly labeled as such.
WITH events AS (
  SELECT 'invoice:' || i."id" AS id, i."userId", 'INVOICE'::"CreditTransactionType" AS type,
    i."amount" AS amount, 'پرداخت صورتحساب #' || i."invoiceNumber" AS description,
    i."id" AS reference_id, NULL::text AS actor_id,
    COALESCE(i."creditAppliedAt", i."paidAt", i."createdAt") AS created_at
  FROM "Invoice" i WHERE i."creditAppliedAt" IS NOT NULL AND i."status" = 'PAID' AND i."amount" > 0
  UNION ALL
  SELECT 'order:' || o."id", o."userId", 'ORDER'::"CreditTransactionType", -o."creditCharged",
    'هزینه سفارش #' || o."orederIdentification", o."id", NULL::text, o."createdAt"
  FROM "OrderBatch" o WHERE o."creditCharged" > 0
  UNION ALL
  SELECT 'refund:' || u."id", o."userId", 'REFUND'::"CreditTransactionType", u."creditRefunded",
    'بازگشت اعتبار سفارش #' || o."orederIdentification", o."id", NULL::text, u."createdAt"
  FROM "OrderUpdate" u JOIN "OrderBatch" o ON o."id" = u."orderBatchId" WHERE u."creditRefunded" > 0
  UNION ALL
  SELECT 'fee:' || a."id", a."entityId", 'DAILY_FEE'::"CreditTransactionType",
    -(a."detail"::jsonb->>'amount')::integer, a."detail"::jsonb->>'reason', a."id", a."actorId", a."createdAt"
  FROM "AuditLog" a WHERE a."action" = 'DAILY_ORDER_FEE_DEDUCTED'
    AND a."entityType" = 'User' AND a."detail" IS NOT NULL AND a."detail" LIKE '{%'
    AND a."entityId" IN (SELECT "id" FROM "User")
  UNION ALL
  SELECT 'adjustment:' || a."id", a."entityId", 'ADJUSTMENT'::"CreditTransactionType",
    (regexp_match(a."detail", '\(([+-]?[0-9]+) تومان\)'))[1]::integer,
    COALESCE(NULLIF(split_part(a."detail", ' | ', 2), ''), 'اصلاح اعتبار توسط مدیر'),
    a."id", a."actorId", a."createdAt"
  FROM "AuditLog" a WHERE a."action" = 'USER_CREDIT_ADJUSTED'
    AND a."entityType" = 'User' AND a."detail" ~ '\([+-]?[0-9]+ تومان\)'
    AND a."entityId" IN (SELECT "id" FROM "User")
), totals AS (
  SELECT u."id", u."credit"::bigint - COALESCE(SUM(e.amount), 0) AS opening
  FROM "User" u LEFT JOIN events e ON e."userId" = u."id" GROUP BY u."id"
), all_events AS (
  SELECT id, "userId", type, amount, description, reference_id, actor_id, created_at FROM events
  UNION ALL
  SELECT 'opening:' || "id", "id", 'OPENING_BALANCE'::"CreditTransactionType", opening::integer,
    'مانده آغازین؛ جزئیات تراکنش‌های قدیمی در دسترس نیست', NULL::text, NULL::text,
    TIMESTAMP '1970-01-01 00:00:00' FROM totals WHERE opening <> 0 AND opening BETWEEN -2147483648 AND 2147483647
), running AS (
  SELECT e.*, SUM(e.amount::bigint) OVER (PARTITION BY e."userId" ORDER BY e.created_at, e.id) AS balance
  FROM all_events e
)
INSERT INTO "CreditTransaction" ("id", "userId", "type", "amount", "balanceAfter", "description", "referenceId", "actorId", "createdAt")
SELECT id, "userId", type, amount, CASE WHEN balance BETWEEN -2147483648 AND 2147483647 THEN balance::integer ELSE NULL END,
  description, reference_id, actor_id, created_at FROM running;
