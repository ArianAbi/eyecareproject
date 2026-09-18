"use server"

import { requireAdmin } from "../access"
import { writeAudit } from "../audit"

import { revalidatePath } from "next/cache";
import { ActionError } from "../action-error";
import prisma from "../db";

export async function ADMIN_CreateTag(tagName: string,color:string) {
    try {
        const actor = await requireAdmin()
        return await prisma.$transaction(async tx => {

        const data = await tx.tags.create({
            data: {
                name: tagName,
                color:color
            }
        })

        await writeAudit(tx, actor.id, "ADMIN_CreateTag", "Tags", data.id)
        revalidatePath("/admin/products/tags")

        return { success: true, data }
    
        })
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(err.message)
        }

        throw new ActionError({
            error: "Failed to create Tag: Unknown error",
        });
    }
}

export async function ADMIN_GetTags() {
    try {
        await requireAdmin()

        const data = await prisma.tags.findMany()

        return { success: true, data }
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(err.message)
        }

        throw new ActionError({
            error: "Failed to create Tag: Unknown error",
        });
    }
}