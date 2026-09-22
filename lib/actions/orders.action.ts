"use server"

import { orderWhere, type OrderFilters } from "../order-filters"
import { ActionError } from "../action-error"
import { auth } from "../Auth"
import prisma from "../db"
import { PaginationObjectDB } from "../pagination-object"
import { requireUser } from "../access"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { markVisibleOrderUpdatesRead } from "../order-updates"

export async function GetOrdersAction(filters: OrderFilters) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            throw Error("you are not logged in")
        }

        const data = await prisma.$transaction(async tnx => {

            const orders = await tnx.orderBatch.findMany({
                where: {
                    ...orderWhere(filters),
                    userId: session.user.id
                },
                include: {
                    _count: {
                        select: {
                            orderItems: true,
                            orderUpdate: { where: { adminOnly: false, readAt: null } },
                        }
                    },
                    orderItems: {
                        select: {
                            purchasedPrice: true,
                            cutPrice: true
                        }
                    }
                },
                orderBy: {
                    createdAt: filters.sort === 'oldest' ? 'asc' : 'desc'
                },
                ...(PaginationObjectDB(filters.page))
            })
            const total = await tnx.orderBatch.count({
                where: {
                    ...orderWhere(filters),
                    userId: session.user.id
                }
            })

            return { orders, total }
        })


        return { success: true, data }
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


export async function GetSingleOrder(id: string) {
    try {
        const session = await auth()

        if (!session || !session.user.id) throw new ActionError({
            error: "شما در هیچ حسابی لاگین نیستید"
        })

        const data = await prisma.orderBatch.findUnique({
            where: {
                id,
                userId: session.user.id
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
                orderUpdate: {
                    where: { adminOnly: false },
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                },
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

export async function MarkOrderUpdatesRead(input: { orderId: string, updateIds: string[] }) {
    const user = await requireUser()
    const { orderId, updateIds } = z.object({
        orderId: z.string().uuid(), updateIds: z.array(z.string().uuid()).max(500),
    }).parse(input)
    // Only acknowledge records actually rendered, never newer updates or private notes.
    const result = await markVisibleOrderUpdatesRead(prisma, user.id, orderId, updateIds)
    if (result.count > 0) revalidatePath('/orders', 'layout')
    return { success: true }
}
