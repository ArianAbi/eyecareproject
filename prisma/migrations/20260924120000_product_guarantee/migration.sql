ALTER TABLE "Product" ADD COLUMN "includesGuarantee" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CartItem" ADD COLUMN "guaranteeClientName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "OrderItem" ADD COLUMN "guaranteeClientName" TEXT NOT NULL DEFAULT '', ADD COLUMN "includesGuarantee" BOOLEAN NOT NULL DEFAULT false;
