"use server"

import { ActionError } from "../action-error"
import prisma from "../db"

export async function ADMIN_CreateMasterCategoryAction(data: FormData) {
    try {
        const name = data.get("name")

        if (!name) throw new ActionError({ error: "نام دسته بندی الزامیست" })

        await setTimeout(async () => {

            const result = await prisma.masterCategory.create({
                data: {
                    name: name.toString()
                }
            })
            return { success: true, data: result }

        }, 1500);

    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to create master category, check console" })
    }
}

export async function ADMIN_GetMasterCategorys() {
    try{
        const data = await prisma.masterCategory.findMany()
        return data
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to get master categorys, check console" })
    }
}