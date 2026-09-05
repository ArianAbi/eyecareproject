"use server"

import { ActionError } from "../action-error"
import prisma from "../db"

export async function GetProductCategorys(withProducts=true) {
    try {
        const data = await prisma.subCategory.findMany({
            include:{
                products:withProducts
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
            error: "Failed to get Product Categorys : Unknown"
        })
    }
}

export async function GetProductCategoryItems(id: string) {
    try {
        const data = await prisma.product.findMany({
            where: {
                id
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
            error: "Failed to get Product Categorys : Unknown"
        })
    }
}