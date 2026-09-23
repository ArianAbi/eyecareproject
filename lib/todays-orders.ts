import type { OrderItemStatus } from "@/generated/prisma/enums"

export type TodayOrder = {
    id: string
    number: number
    status: OrderItemStatus
    createdAt: string
    total: number
    deliveryPrice: number
    itemCount: number
    lensCount: number
    customerNote: string
    user: { id: string, username: string, storeName: string, credit: number }
}

/** Filter before grouping, but derive the user dropdown from the full day's orders. */
export function groupTodayOrders(orders: TodayOrder[], userId = "all", status = "all") {
    const groups = new Map<string, { user: TodayOrder["user"], orders: TodayOrder[], total: number }>()
    for (const order of orders) {
        if (userId !== "all" && order.user.id !== userId) continue
        if (status !== "all" && order.status !== status) continue
        const group = groups.get(order.user.id) ?? { user: order.user, orders: [], total: 0 }
        group.orders.push(order)
        group.total += order.total
        groups.set(order.user.id, group)
    }
    return [...groups.values()]
}

export function todayOrderUsers(orders: TodayOrder[]) {
    return [...new Map(orders.map(order => [order.user.id, order.user])).values()]
        .sort((a, b) => a.username.localeCompare(b.username, "fa"))
}
