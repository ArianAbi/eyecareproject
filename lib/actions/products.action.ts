"use server"

import { ActionError } from "../action-error"
import prisma from "../db"

export async function GetProductsAction() {
    try {
        const data = await prisma.product.findMany({
            include: {
                lens: true,
                tags: true
            }
        })

        return {success:true,data:data}
    } catch (err) {
        console.error("Get Products", err)

        if (err instanceof Error) {
            throw new ActionError({
                error: `Get Products Error, message : ${err.message}`
            })
        }

        throw new ActionError({ error: "Get Products Failed, check console" })
    }
}