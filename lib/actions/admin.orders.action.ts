"use server"

import { OrderItemStatus } from "@/generated/prisma/enums"
import { ActionError } from "../action-error"
import { auth } from "../Auth"
import prisma from "../db"

type ExtendedOrderStatus = OrderItemStatus | 'ALL'

export async function ADMIN_GetOrdersAction({
    status = 'ALL',
    excludeStatus = false
}: {
    status?: ExtendedOrderStatus,
    excludeStatus?: boolean
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

        const data = await prisma.orderBatch.findMany({
            ...(status !== 'ALL'
                ?
                excludeStatus ?
                    {
                        where: {
                            NOT: status
                        }
                    }
                    :
                    {
                        where: {
                            status
                        }
                    }
                :
                {}
            ),
            include: {
                orderItems: {
                    select: {
                        _count: true
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