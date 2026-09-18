import type { Prisma } from "@/generated/prisma/client"
import { parseDateFilterParam } from "./prisma-date-filter"

export const orderStatuses = ["PENDING", "APPROVED", "INPROCESS", "FINISHED", "SENT", "ONHOLD"] as const
export type OrderFilters = { page?: number | string, status?: string, excludeStatus?: boolean,
    userId?: string | null, date?: string, orderNumber?: string, sort?: string }

export function orderWhere(filters: OrderFilters): Prisma.OrderBatchWhereInput {
    const status = orderStatuses.find(value => value === filters.status)
    const number = Number(filters.orderNumber)
    return {
        ...(status ? { status: filters.excludeStatus ? { not: status } : status } : {}),
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.date ? { createdAt: parseDateFilterParam(filters.date) } : {}),
        ...(Number.isSafeInteger(number) && number > 0 ? { orederIdentification: number } : {}),
    }
}

export function selectedUser(raw?: string) {
    try {
        const value = JSON.parse(raw ?? "null")
        return typeof value?.value === "string" ? value.value : undefined
    } catch { return undefined }
}
