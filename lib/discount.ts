import { ExpectedError } from "./action-result";
import { lensPrice } from "./lens-policy";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;
type CartLine = { productId: string; odOnly: boolean; product: { price: number } };

export function normalizeDiscountCode(code: string) {
  return code.trim().toUpperCase();
}

export async function calculateDiscount(tx: Tx, code: string, userId: string, items: CartLine[]) {
  const normalized = normalizeDiscountCode(code);
  if (!normalized || normalized.length > 64) throw new ExpectedError("کد تخفیف نامعتبر است.");
  const discount = await tx.discount.findFirst({
    where: { code: { equals: normalized, mode: "insensitive" } },
    include: { users: { select: { id: true } }, products: { select: { id: true } } },
  });
  if (!discount || !discount.active || (discount.expiresAt && discount.expiresAt <= new Date()) ||
      (discount.maxUses !== null && discount.usedCount >= discount.maxUses)) {
    throw new ExpectedError("کد تخفیف معتبر نیست یا منقضی شده است.");
  }
  if (discount.usersRestricted && !discount.users.some(user => user.id === userId)) {
    throw new ExpectedError("این کد تخفیف برای این کاربر قابل استفاده نیست.");
  }
  const eligible = discount.productsRestricted
    ? items.filter(item => discount.products.some(product => product.id === item.productId))
    : items;
  if (!eligible.length) throw new ExpectedError("این کد تخفیف برای محصولات سبد خرید قابل استفاده نیست.");
  const eligibleTotal = eligible.reduce((sum, item) => sum + lensPrice(item.product.price, item.odOnly), 0);
  const amount = discount.amountType === "PERCENT"
    ? Math.round(eligibleTotal * discount.value / 10000)
    : Math.min(discount.value, eligibleTotal);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new ExpectedError("مبلغ تخفیف معتبر نیست.");
  return { discountId: discount.id, code: discount.code, title: discount.title, amount };
}

export async function reserveDiscount(tx: Tx, discountId: string) {
  const count = await tx.$executeRaw`
    UPDATE "Discount" SET "usedCount" = "usedCount" + 1
    WHERE "id" = ${discountId} AND "active" = true
      AND ("expiresAt" IS NULL OR "expiresAt" > CURRENT_TIMESTAMP)
      AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
  `;
  if (count !== 1) throw new ExpectedError("ظرفیت استفاده از کد تخفیف به پایان رسیده است.");
}
