CREATE TABLE "Setting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "siteName" TEXT NOT NULL DEFAULT 'SalimOptic',
    "deliveryPrice" INTEGER NOT NULL DEFAULT 0,
    "cutPrice" INTEGER NOT NULL DEFAULT 0,
    "baleGroupId" TEXT,
    "telegramGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Setting_singleton" CHECK ("id" = 'global'),
    CONSTRAINT "Setting_prices_nonnegative" CHECK ("deliveryPrice" >= 0 AND "cutPrice" >= 0)
);
