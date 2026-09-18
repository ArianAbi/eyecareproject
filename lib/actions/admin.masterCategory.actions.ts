"use server"

import { requireAdmin } from "../access"
import { writeAudit } from "../audit"

import { revalidatePath } from "next/cache"
import { ActionError } from "../action-error"
import prisma from "../db"
import { ProductType } from "@/generated/prisma/enums"

export async function ADMIN_CreateMasterCategoryAction(name: string, type: ProductType) {
    try {
        const actor = await requireAdmin()
        return await prisma.$transaction(async tx => {

        if (!name) throw new ActionError({ error: "نام دسته بندی الزامیست" })

        const result = await tx.masterCategory.create({
            data: {
                name: name,
                type: type
            }
        })

        await writeAudit(tx, actor.id, "ADMIN_CreateMasterCategoryAction", "MasterCategory", result.id)
        revalidatePath(`/admin/product-category`)

        return { success: true, data: result }
    
        })
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to create master category, check console" })
    }
}

export async function ADMIN_GetMasterCategorys() {
    try {
        await requireAdmin()

        const data = await prisma.masterCategory.findMany({
            include: {
                subCategory: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })
        return { data, success: true }
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to get master categorys, check console" })
    }
}

export async function ADMIN_UpdateMasterCategorys(id: string, name: string, active: boolean) {
    try {
        const actor = await requireAdmin()
        return await prisma.$transaction(async tx => {

        const data = await tx.masterCategory.update({
            where: { id: id },
            data: {
                name: name,
                active: active
            }
        })

        await writeAudit(tx, actor.id, "ADMIN_UpdateMasterCategorys", "MasterCategory", data.id)
        revalidatePath(`/admin/product-category`)

        return { data, success: true }
    
        })
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to get master categorys, check console" })
    }
}

export async function ADMIN_DeleteMasterCategorys(id: string) {
    try {
        const actor = await requireAdmin()
        return await prisma.$transaction(async tx => {

        await tx.masterCategory.delete({
            where: { id }
        })

        await writeAudit(tx, actor.id, "ADMIN_DeleteMasterCategorys", "MasterCategory", id)
        revalidatePath(`/admin/product-category`)

        return { success: true }
    
        })
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to delete master categorys, check console" })
    }
}