"use server";

import { actionResult, ExpectedError } from "../action-result";
import { requireAdmin, requireUser } from "../access";
import { calculateDiscount, normalizeDiscountCode } from "../discount";
import { assertOrderEligibility, storedPrescription } from "../lens-policy";
import prisma from "../db";
import { writeAudit } from "../audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const discountInput = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000),
  code: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  amountType: z.enum(["PERCENT", "FLAT"]),
  value: z.number().int().positive().max(2147483647),
  maxUses: z.number().int().positive().max(2147483647).nullable(),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  active: z.boolean(),
  usersRestricted: z.boolean(),
  productsRestricted: z.boolean(),
  userIds: z.array(z.string().uuid()).max(500),
  productIds: z.array(z.string().uuid()).max(500),
});

export async function ADMIN_SaveDiscount(input: z.infer<typeof discountInput> & { id?: string }) {
  return actionResult(async () => {
    const actor = await requireAdmin();
    const data = discountInput.parse(input);
    if (data.amountType === "PERCENT" && data.value > 10000) throw new ExpectedError("درصد تخفیف نباید بیشتر از ۱۰۰ باشد.");
    if ((data.usersRestricted && !data.userIds.length) || (data.productsRestricted && !data.productIds.length)) {
      throw new ExpectedError("برای محدودیت فعال، حداقل یک کاربر یا محصول انتخاب کنید.");
    }
    const code = normalizeDiscountCode(data.code);
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (expiresAt && expiresAt <= new Date()) throw new ExpectedError("تاریخ انقضا باید در آینده باشد.");
    const id = input.id ? z.string().uuid().parse(input.id) : undefined;
    const saved = await prisma.$transaction(async tx => {
      const previous = id ? await tx.discount.findUniqueOrThrow({ where: { id } }) : null;
      const duplicate = await tx.discount.findFirst({ where: { code: { equals: code, mode: "insensitive" }, ...(id && { id: { not: id } }) }, select: { id: true } });
      if (duplicate) throw new ExpectedError("این کد تخفیف قبلاً ثبت شده است.");
      if (previous && data.maxUses !== null && data.maxUses < previous.usedCount) {
        throw new ExpectedError("سقف استفاده نمی‌تواند از تعداد مصرف شده کمتر باشد.");
      }
      const [users, products] = await Promise.all([
        tx.user.count({ where: { id: { in: data.userIds } } }),
        tx.product.count({ where: { id: { in: data.productIds } } }),
      ]);
      if (users !== new Set(data.userIds).size || products !== new Set(data.productIds).size) {
        throw new ExpectedError("کاربر یا محصول انتخاب شده یافت نشد.");
      }
      const fields = {
        title: data.title, description: data.description, code,
        amountType: data.amountType, value: data.value, maxUses: data.maxUses,
        expiresAt, active: data.active, usersRestricted: data.usersRestricted, productsRestricted: data.productsRestricted,
        users: { set: data.userIds.map(id => ({ id })) },
        products: { set: data.productIds.map(id => ({ id })) },
      };
      const discount = id
        ? await tx.discount.update({ where: { id }, data: fields })
        : await tx.discount.create({ data: { ...fields, users: { connect: data.userIds.map(id => ({ id })) }, products: { connect: data.productIds.map(id => ({ id })) } } });
      await writeAudit(tx, actor.id, id ? "DISCOUNT_UPDATED" : "DISCOUNT_CREATED", "Discount", discount.id);
      return discount;
    });
    revalidatePath("/admin/discounts");
    return { success: true, discount: saved };
  });
}

export async function ADMIN_SetDiscountActive(id: string, active: boolean) {
  return actionResult(async () => {
    const actor = await requireAdmin();
    id = z.string().uuid().parse(id);
    active = z.boolean().parse(active);
    await prisma.$transaction(async tx => {
      await tx.discount.update({ where: { id }, data: { active } });
      await writeAudit(tx, actor.id, active ? "DISCOUNT_ACTIVATED" : "DISCOUNT_DEACTIVATED", "Discount", id);
    });
    revalidatePath("/admin/discounts");
    return { success: true };
  });
}

export async function PreviewDiscount(code: string, adminUserId?: string) {
  return actionResult(async () => {
    const actor = adminUserId ? await requireAdmin() : await requireUser();
    const userId = adminUserId ? z.string().uuid().parse(adminUserId) : actor.id;
    const cart = await prisma.cart.findUnique({ where: { userId }, include: { cartItems: { include: { product: { include: { lens: true } } } } } });
    if (!cart?.cartItems.length) throw new ExpectedError("سبد خرید خالی است.");
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { userStatus: true } });
    for (const item of cart.cartItems) assertOrderEligibility(user.userStatus, item.product, storedPrescription(item));
    const result = await calculateDiscount(prisma, code, userId, cart.cartItems);
    return { success: true, code: result.code, amount: result.amount };
  });
}

export async function ADMIN_SearchDiscountTargets(kind: "user" | "product", query: string) {
  await requireAdmin();
  query = z.string().trim().min(1).max(80).parse(query);
  if (kind === "user") return prisma.user.findMany({
    where: { OR: [{ username: { contains: query, mode: "insensitive" } }, { number: { contains: query } }] },
    select: { id: true, username: true }, take: 20, orderBy: { username: "asc" },
  }).then(rows => rows.map(row => ({ id: row.id, label: row.username })));
  if (kind === "product") return prisma.product.findMany({
    where: { name: { contains: query, mode: "insensitive" } },
    select: { id: true, name: true }, take: 20, orderBy: { name: "asc" },
  }).then(rows => rows.map(row => ({ id: row.id, label: row.name })));
  throw new ExpectedError("نوع جستجو نامعتبر است.");
}
