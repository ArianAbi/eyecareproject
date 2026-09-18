"use server"

import { requireAdmin } from "../access"
import { writeAudit } from "../audit"
import { orderWhere, orderStatuses, type OrderFilters } from "../order-filters"
import { OrderItemStatus } from "@/generated/prisma/enums"
import { ActionError } from "../action-error"
import { auth } from "../Auth"
import prisma from "../db"
import { Prisma } from "@/generated/prisma/client"
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
                orderUpdate: true,
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

export async function ADMIN_UpdateOrderStatus({
    id, newStatus
}: { id: string, newStatus: OrderItemStatus }) {
    try {
        const actor = await requireAdmin()
        if (!orderStatuses.includes(newStatus)) throw new Error("درخواست نامعتبر است یا امکان انجام این عملیات وجود ندارد")
        const data = await prisma.$transaction(async tx => {
            const previous = await tx.orderBatch.findUniqueOrThrow({ where: { id } })
            const order = await tx.orderBatch.update({ where: { id }, data: {
                status: newStatus,
                orderUpdate: { create: { updatedStatus: newStatus } },
            } })
            await writeAudit(tx, actor.id, "ORDER_STATUS_CHANGED", "OrderBatch", id, `${previous.status} -> ${newStatus}`)
            return order
        })
        revalidatePath(`/admin/orders/${id}`)
        revalidatePath('/orders', 'layout')
        revalidatePath('/admin/summary')

        revalidatePath('/admin/orders')

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