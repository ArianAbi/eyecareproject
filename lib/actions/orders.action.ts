"use server"

import { ActionError } from "../action-error"
import { auth } from "../Auth"
import prisma from "../db"

export async function GetOrdersAction() {
    try {
        const session = await auth()

        if (!session) {
            throw Error("you are not logged in")
        }

        const data = await prisma.orderBatch.findMany({
            where: {
                userId: session.user.id
            },
            orderBy:{
                createdAt:'desc'
            }
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