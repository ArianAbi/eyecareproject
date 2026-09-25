import { ExpectedError } from "./action-result"
import type { Prisma } from "@/generated/prisma/client"
import { z } from "zod"
import { orderStatuses } from "./order-filters"
import { writeAudit } from "./audit"

export const orderUpdateInput = z.object({
    id: z.string().uuid(),
    newStatus: z.enum(orderStatuses).optional(),
    message: z.string().trim().max(2000).default(""),
    adminOnly: z.boolean().default(false),
    refundCredit: z.boolean().default(false),
})

export function markVisibleOrderUpdatesRead(db: Pick<Prisma.TransactionClient, "orderUpdate">,
    userId: string, orderId: string, updateIds: string[]) {
    return db.orderUpdate.updateMany({
        where: {
            id: { in: updateIds }, orderBatchId: orderId,
            orderBatch: { userId }, adminOnly: false, readAt: null,
        },
        data: { readAt: new Date() },
    })
}

export async function saveOrderUpdate(tx: Prisma.TransactionClient, actorId: string,
    input: z.infer<typeof orderUpdateInput>) {
    // Serialize updates to this order, including concurrent refund requests.
    await tx.$queryRaw`SELECT "id" FROM "OrderBatch" WHERE "id" = ${input.id} FOR UPDATE`
    const previous = await tx.orderBatch.findUniqueOrThrow({ where: { id: input.id } })
    const status = input.newStatus ?? previous.status
    if (previous.creditRefundedAt && status !== "ONHOLD") throw new ExpectedError("Refunded orders cannot be reopened. Create a new order.")
    let creditRefunded = 0

    if (input.refundCredit) {
        if (status !== "ONHOLD") throw new ExpectedError("بازگشت اعتبار فقط برای سفارش رد شده امکان‌پذیر است")
        if (previous.creditRefundedAt) throw new ExpectedError("اعتبار این سفارش قبلاً بازگردانده شده است")
        if (previous.creditCharged <= 0) throw new ExpectedError("برای این سفارش کسر اعتبار ثبت نشده است")
        creditRefunded = previous.creditCharged
        const credited = await tx.user.updateMany({ where: { id: previous.userId, credit: { lte: 2147483647 - creditRefunded } }, data: { credit: { increment: creditRefunded } } })
        if (!credited.count) throw new ExpectedError("Balance limit reached; refund was not applied.")
        await writeAudit(tx, actorId, "ORDER_CREDIT_REFUNDED", "OrderBatch", input.id, `amount: ${creditRefunded}`)
    }

    // Bulk actions may include orders already in the chosen status.
    if (status === previous.status && !input.message && !input.refundCredit) return previous

    const order = await tx.orderBatch.update({
        where: { id: input.id },
        data: {
            status,
            ...(input.refundCredit ? { creditRefundedAt: new Date() } : {}),
            orderUpdate: { create: {
                updatedStatus: status,
                message: input.message || null,
                adminOnly: input.adminOnly,
                creditRefunded,
            } },
        },
    })
    await writeAudit(tx, actorId, status === previous.status ? "ORDER_UPDATE_ADDED" : "ORDER_STATUS_CHANGED",
        "OrderBatch", input.id, `${previous.status} -> ${status}; adminOnly: ${input.adminOnly}`)
    return order
}
