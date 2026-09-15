"use server"

import { OrderItemStatus } from "@/generated/prisma/enums"
import { ActionError } from "../action-error"
import { auth } from "../Auth"
import prisma from "../db"
import { Prisma } from "@/generated/prisma/client"
import { PaginationObjectDB } from "../pagination-object"

type ExtendedOrderStatus = OrderItemStatus | 'ALL'

export async function ADMIN_GetOrdersAction(filters: {
    status?: ExtendedOrderStatus,
    excludeStatus?: boolean,
    userId?: string | null,
    page?: number
}) {
    try {
        const session = await auth()

        if (!session) {
            throw Error("you are not logged in")
        }

        const loggedInUser = await prisma.user.findUnique({
            where: {
                id: session.user.id
            },
            select: {
                admin: true
            }
        })

        if (!loggedInUser || !loggedInUser.admin) {
            throw Error("you dont have permission")
        }

        const whereFilter: Prisma.OrderBatchWhereInput = {}

        //PAGINATION


        //STATUS FILTER
        if (filters.status !== 'ALL') {
            whereFilter.status = filters.excludeStatus ? { not: filters.status } : filters.status
        } else {
            whereFilter.status = {}
        }

        // USER FILTER
        if (filters.userId) {
            whereFilter.userId = filters.userId
        }

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
                    createdAt: 'desc'
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
        const data = await prisma.orderBatch.findUnique({
            where: {
                id
            },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id:true,
                                includesBag: true,
                                includesCleaningCloth: true,
                                includesCleaningSpray: true,
                                name: true,
                                categoryRel:{
                                    select:{
                                        color:true,
                                        name:true
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