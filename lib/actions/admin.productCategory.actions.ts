"use server"

import { revalidatePath } from "next/cache"
import { ActionError } from "../action-error"
import prisma from "../db"

export async function ADMIN_CreateProductCategoryAction(data: FormData) {
    try {
        console.log(data);

        const name = data.get("name")
        const description = data.get("description")
        const masterCategoryId = data.get("masterCategoryId")

        if (!name) throw new ActionError({ error: "نام دسته بندی الزامیست" })
        if (!description) throw new ActionError({ error: "توضیحات الزامیست" })
        if (!masterCategoryId) throw new ActionError({ error: "زیرمجموعه باید انتخاب شود" })

        const result = await prisma.subCategory.create({
            data: {
                name: name.toString(),
                description: description.toString(),
                masterCategoryId: masterCategoryId.toString()
            }
        })

        revalidatePath(`/admin/mater-category`)

        return { success: true, data: result }
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to create sub category, check console" })
    }
}

export async function ADMIN_GetProductCategorys() {
    try {
        const data = await prisma.subCategory.findMany({
            include: {
                masterCategory: true,
                products: true
            }
        })
        return { data, success: true }
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to get master categorys, check console" })
    }
}

export async function ADMIN_UpdateProductCategorys(id: string, name: string, description: string) {
    try {
        const data = await prisma.subCategory.update({
            where: { id: id },
            data: {
                name: name,
                description: description
            }
        })

        revalidatePath(`/admin/product-category`)

        return { data, success: true }
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to get product categorys, check console" })
    }
}

export async function ADMIN_DeleteProductCategorys(id: string) {
    try {
        const data = await prisma.subCategory.findFirst({
            include: {
                products: true
            },
            where: {
                id: id
            }
        })

        if (!data) throw new ActionError({ error: "failed to fetch this category data" })
        if (data.products.length > 0) throw new ActionError({ error: "این دسته بندی محصول دارد و قابل حذف نیست" })

        await prisma.subCategory.delete({
            where: { id }
        })

        revalidatePath(`/admin/product-category`)

        return { success: true }
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to delete master categorys, check console" })
    }
}