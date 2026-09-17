"use server"

import { ActionError } from "../action-error"
import { auth } from "../Auth"
import prisma from "../db"
import { PaginationObjectDB, paginationSkipNumber } from "../pagination-object"

export async function GetOrdersAction(filters: {
    page?: number
}) {
    try {
        const session = await auth()

        if (!session) {
            throw Error("you are not logged in")
        }

        const data = await prisma.$transaction(async tnx => {

            const orders = await tnx.orderBatch.findMany({
                where: {
                    userId: session.user.id
                },
                include: {
                    _count: {
                        select: {
                            orderItems: true
                        }
                    },
                    orderItems: {
                        select: {
                            purchasedPrice: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                ...(PaginationObjectDB(filters.page))
            })
            const total = await tnx.orderBatch.count({
                where: {
                    userId: session.user.id
                }
            })

            return {orders,total}
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