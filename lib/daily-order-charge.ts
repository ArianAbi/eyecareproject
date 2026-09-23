import type { Prisma } from "@/generated/prisma/client"
import { z } from "zod"
import { parseDateFilterParam, tehranDay, validDay } from "./prisma-date-filter"

export const dailyChargeInput = z.object({
    userId: z.string().uuid(), requestId: z.string().uuid(),
    day: z.string().refine(validDay), kind: z.enum(["delivery", "custom"]),
    amount: z.number().int().positive().max(2147483647),
    expectedCredit: z.number().int().min(0).max(2147483647),
    reason: z.string().trim().min(3).max(300),
})
export type DailyChargeInput = z.infer<typeof dailyChargeInput>
export class DailyChargeError extends Error {}

/** The balance, audit receipt and customer-visible event commit together. */
export async function deductDailyOrderCharge(tx: Prisma.TransactionClient, actorId: string, input: DailyChargeInput) {
    // Lock the account to serialize fees, including submissions from different admins.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${input.userId} FOR UPDATE`
    const receiptId = input.kind === "delivery"
        ? `daily-delivery:${input.day}:${input.userId}` : `daily-custom:${input.requestId}`
    const previous = await tx.auditLog.findUnique({ where: { id: receiptId } })
    if (previous) {
        if (previous.entityId !== input.userId || previous.action !== "DAILY_ORDER_FEE_DEDUCTED") {
            throw new DailyChargeError("شناسه درخواست نامعتبر است.")
        }
        if (input.kind === "custom") {
            const detail = JSON.parse(previous.detail ?? "{}")
            if (detail.amount !== input.amount || detail.reason !== input.reason || detail.day !== input.day) {
                throw new DailyChargeError("این درخواست قبلاً با اطلاعات دیگری ثبت شده است. صفحه را تازه کنید.")
            }
        }
        return { alreadyApplied: true }
    }
    if (input.day !== tehranDay()) throw new DailyChargeError("روز تغییر کرده است. صفحه را تازه کنید.")
    const order = await tx.orderBatch.findFirst({
        where: { userId: input.userId, createdAt: parseDateFilterParam(JSON.stringify({ from: input.day }))! },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }], select: { id: true, status: true },
    })
    if (!order) throw new DailyChargeError("این کاربر امروز سفارشی ندارد.")
    if (input.kind === "delivery") {
        const settings = await tx.setting.findUnique({ where: { id: "global" }, select: { deliveryPrice: true } })
        if (input.amount !== (settings?.deliveryPrice ?? 0)) {
            throw new DailyChargeError("هزینه ارسال تغییر کرده است. صفحه را تازه کنید.")
        }
    }
    if (input.amount > input.expectedCredit) throw new DailyChargeError("اعتبار کاربر برای این کسر کافی نیست.")
    const result = await tx.user.updateMany({
        where: { id: input.userId, credit: input.expectedCredit },
        data: { credit: { decrement: input.amount } },
    })
    if (result.count !== 1) throw new DailyChargeError("موجودی کاربر تغییر کرده است. صفحه را تازه کنید و دوباره تلاش کنید.")
    const reason = input.kind === "delivery" ? "هزینه ارسال سفارش‌های روز" : input.reason
    await tx.auditLog.create({ data: {
        id: receiptId, actorId, action: "DAILY_ORDER_FEE_DEDUCTED", entityType: "User", entityId: input.userId,
        detail: JSON.stringify({ day: input.day, kind: input.kind, amount: input.amount, reason,
            before: input.expectedCredit, after: input.expectedCredit - input.amount, orderId: order.id }),
    } })
    const dayLabel = new Date(`${input.day}T12:00:00Z`).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })
    await tx.orderUpdate.create({ data: {
        orderBatchId: order.id, updatedStatus: order.status, adminOnly: false,
        message: `${reason} (${dayLabel}): ${input.amount.toLocaleString("fa-IR")} تومان از اعتبار شما کسر شد. این مبلغ جدا از هزینه‌های ثبت‌شده سفارش است.`,
    } })
    return { alreadyApplied: false }
}
