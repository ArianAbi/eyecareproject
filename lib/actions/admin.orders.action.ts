"use server"

import { OrderItemStatus } from "@/generated/prisma/enums"
import { ActionError } from "../action-error"
import { auth } from "../Auth"
import prisma from "../db"
import { Prisma } from "@/generated/prisma/client"

type ExtendedOrderStatus = OrderItemStatus | 'ALL'

export async function ADMIN_GetOrdersAction(filters: {
    status?: ExtendedOrderStatus,
    excludeStatus?: boolean,
    userId?: string | null
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

        //STATUS FILTER
        if(filters.status !== 'ALL'){
            whereFilter.status = filters.excludeStatus ? {not:filters.status} : filters.status
        }else{
            whereFilter.status = {}
        }

        // USER FILTER
        if(filters.userId){
            whereFilter.userId = filters.userId
        }

        const data = await prisma.orderBatch.findMany({
            where: whereFilter,
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