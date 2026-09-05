"use server"

import { revalidatePath } from "next/cache";
import { ActionError } from "../action-error";
import prisma from "../db";

export async function ADMIN_CreateTag(tagName: string,color:string) {
    try {
        const data = await prisma.tags.create({
            data: {
                name: tagName,
                color:color
            }
        })

        revalidatePath("/admin/products/tags")

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

export async function ADMIN_GetTags() {
    try {
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