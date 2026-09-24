"use server"

import { calculateOrderCount } from "@/lib/order-count";
import { requireAdmin } from "../access"
import prisma from "../db"
import { getSettings } from "../settings"
import { tehranDay, parseDateFilterParam, validDay } from "../prisma-date-filter"
import { calculateOrderTotal } from "../order-credit"
import type { TodayOrder } from "../todays-orders"
import { revalidatePath } from "next/cache"
import { dailyChargeInput, DailyChargeError, deductDailyOrderCharge, type DailyChargeInput } from "../daily-order-charge"

export async function ADMIN_GetTodayOrdersAction(rawDay?: string) {
    await requireAdmin()
    const today = tehranDay()
    const day = validDay(rawDay) ? rawDay : today
    const [orders, settings, receipts] = await Promise.all([
        prisma.orderBatch.findMany({
            where: { createdAt: parseDateFilterParam(JSON.stringify({ from: day }))! },
            orderBy: [{ createdAt: "desc" }, { id: "asc" }],
            select: {
                id: true, orederIdentification: true, status: true, createdAt: true,
                deliveryPrice: true, customerNote: true,
                user: { select: { id: true, username: true, storeName: true, credit: true } },
                orderItems: { select: { purchasedPrice: true, cutPrice: true, odOnly: true } },
            },
        }),
        getSettings(),
        prisma.auditLog.findMany({
            where: { action: "DAILY_ORDER_FEE_DEDUCTED", entityType: "User",
                createdAt: parseDateFilterParam(JSON.stringify({ from: day }))! },
            select: { id: true, entityId: true, detail: true }, orderBy: { createdAt: "desc" },
        }),
    ])
    const data: TodayOrder[] = orders.map(order => ({
        id: order.id, number: order.orederIdentification, status: order.status,
        createdAt: order.createdAt.toISOString(), total: calculateOrderTotal(order),
        deliveryPrice: order.deliveryPrice, customerNote: order.customerNote,
        itemCount: order.orderItems.length,
        lensCount: calculateOrderCount(order.orderItems),
        user: order.user,
    }))
    const charges = receipts.flatMap(receipt => {
        try {
            const detail = JSON.parse(receipt.detail ?? "{}")
            if (detail.day !== day || !receipt.entityId || !Number.isSafeInteger(detail.amount)) return []
            return [{ id: receipt.id, userId: receipt.entityId, amount: detail.amount as number,
                kind: String(detail.kind), reason: String(detail.reason) }]
        } catch { return [] }
    })
    return { day, isToday: day === today, orders: data, deliveryPrice: settings.deliveryPrice, charges }
}

export async function ADMIN_DeductDailyOrderFeeAction(input: DailyChargeInput) {
    const actor = await requireAdmin()
    const parsed = dailyChargeInput.safeParse(input)
    if (!parsed.success) return { success: false as const, error: "مبلغ و توضیح هزینه را بررسی کنید." }
    let result
    try {
        result = await prisma.$transaction(tx => deductDailyOrderCharge(tx, actor.id, parsed.data))
    } catch (error) {
        if (error instanceof DailyChargeError) return { success: false as const, error: error.message }
        console.error("Daily order fee failed", error)
        return { success: false as const, error: "کسر اعتبار انجام نشد. دوباره تلاش کنید." }
    }
    revalidatePath("/admin", "layout")
    revalidatePath("/(main)", "layout")
    return { success: true as const, ...result }
}
