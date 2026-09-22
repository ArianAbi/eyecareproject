"use server"

import { requireAdmin } from "../access"
import { orderWhere, type OrderFilters } from "../order-filters"
import { orderUpdateInput, saveOrderUpdate } from "../order-updates"
import { OrderItemStatus } from "@/generated/prisma/enums"
import { ActionError } from "../action-error"
import prisma from "../db"
import { PaginationObjectDB } from "../pagination-object"
import { revalidatePath } from "next/cache"

export async function ADMIN_GetOrdersAction(filters: OrderFilters) {
    try {
        await requireAdmin()
        const whereFilter = orderWhere(filters)

        const { data, total } = await prisma.$transaction(async tnx => {
            const data = await tnx.orderBatch.findMany({
                where: whereFilter,
                ...(PaginationObjectDB(filters.page)),
                include: {
                    _count: {
                        select: {
                            orderItems: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            username: true
                        }
                    },
                },
                orderBy: {
                    createdAt: filters.sort === 'oldest' ? 'asc' : 'desc'
                },
            })

            const total = await tnx.orderBatch.count({
                where: whereFilter
            })

            return { data, total }

        })


        return { success: true, data, total }
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }
        throw new ActionError({
            error: "get orders admin:unknown error"
        })
    }
}

export async function ADMIN_GetSingleOrder(id: string) {
    try {
        await requireAdmin()
        const data = await prisma.orderBatch.findUnique({
            where: {
                id
            },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                includesBag: true,
                                includesCleaningCloth: true,
                                includesCleaningSpray: true,
                                name: true,
                                categoryRel: {
                                    select: {
                                        color: true,
                                        name: true
                                    }
                                }
                            },
                        }
                    }
                },
                orderUpdate: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] },
                user: {
                    select: {
                        id: true,
                        username: true,
                    }
                }
            }
        })

        return { sucess: true, data }
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }
        throw new ActionError({
            error: "get orders admin:unknown error"
        })
    }
}

export async function ADMIN_UpdateOrderStatus(input: {
    id: string, newStatus?: OrderItemStatus, message?: string, adminOnly?: boolean, refundCredit?: boolean
}) {
    try {
        const actor = await requireAdmin()
        const parsed = orderUpdateInput.safeParse(input)
        if (!parsed.success) throw new Error("اطلاعات بروزرسانی سفارش نامعتبر است")
        const { id } = parsed.data
        const data = await prisma.$transaction(tx => saveOrderUpdate(tx, actor.id, parsed.data))
        revalidatePath(`/admin/orders/${id}`)
        revalidatePath('/orders', 'layout')
        revalidatePath('/admin/summary')

        revalidatePath('/admin/orders')
        revalidatePath(`/admin/users/${data.userId}`)
        revalidatePath('/', 'layout')

        return { sucess: true, data }
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }
        throw new ActionError({
            error: "get orders admin:unknown error"
        })
    }
}
