"use server"

import { ActionError } from "../action-error"
import prisma from "../db"

export async function GetTags() {
    try {
        const data = await prisma.tags.findMany()

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