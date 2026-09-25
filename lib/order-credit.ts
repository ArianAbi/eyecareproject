import { ExpectedError } from "./action-result"
import type { Prisma } from "@/generated/prisma/client"

export async function chargeOrderCredit(tx: Prisma.TransactionClient, userId: string, amount: number) {
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 2147483647) {
        throw new ExpectedError("مبلغ سفارش نامعتبر است")
    }
    const charged = await tx.user.updateMany({
        where: { id: userId, credit: { gte: amount } },
        data: { credit: { decrement: amount } },
    })
    if (charged.count !== 1) throw new ExpectedError("موجودی شما کافی نیست")
}

export function calculateOrderTotal(order: { orderItems: { purchasedPrice: number, cutPrice?: number }[], deliveryPrice: number }) {
    return order.orderItems.reduce((acc, item) => acc + item.purchasedPrice + (item.cutPrice ?? 0), 0) + order.deliveryPrice
}

// How much more credit the user needs before they can cover this order's total.
// Returns 0 if their current credit already covers it.
export function creditShortfall(orderTotal: number, userCredit: number) {
    return Math.max(orderTotal - userCredit, 0)
}
